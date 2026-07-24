import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { getOrder, updateOrder, uploadOrderItemIcon } from "@/services/orders";
import { getCustomer, uploadCustomerBodyImage } from "@/services/customers";
import { resolvePublicUrl } from "@/services/api";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";

import { Camera, FileImage, Loader2, Plus, Trash2, Eye, Pencil } from "lucide-react";
import { OrderCustomizationDialog } from "@/components/OrderCustomizationDialog";
import DatePicker from "@/components/DatePicker";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { listCustomizations } from "@/services/customizations";

type ItemDraft = {
  garment_type: string | null;
  measurement_id: number | null;
  icon_path: string | null;
  note: string | null;
  quantity: string;
  price: string;
  handwork: boolean;
  customizations: Record<number, { priceModifier: number, note: string }>;
};

export default function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const orderId = id ? Number(id) : NaN;

  const [isEditing, setIsEditing] = useState(false);
  const [fabricDraft, setFabricDraft] = useState("");
  const [trialDateDraft, setTrialDateDraft] = useState("");
  const [deliveryDateDraft, setDeliveryDateDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<"measurement" | "cutting" | "stitching" | "trial_1" | "trial_2" | "delivery" | "pending" | "completed" | "delivered">("measurement");
  const [priceDraft, setPriceDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [itemsDraft, setItemsDraft] = useState<ItemDraft[]>([]);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const bodyImageRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const [activeCustomizationRowIndex, setActiveCustomizationRowIndex] = useState<number | null>(null);

  // Load all customizations to flat map option ID -> option Name
  const { data: customizationsData } = useQuery({
    queryKey: ["customizations"],
    queryFn: listCustomizations,
  });

  const optionsMap = useMemo(() => {
    const map = new Map<number, string>();
    if (!customizationsData) return map;
    Object.values(customizationsData).forEach((categories: any) => {
      categories.forEach((cat: any) => {
        cat.options.forEach((opt: any) => {
          map.set(opt.id, opt.name);
        });
      });
    });
    return map;
  }, [customizationsData]);

  const updateItemField = (index: number, field: keyof ItemDraft, value: any) => {
    setItemsDraft((prev) => prev.map((x, i) => (i === index ? { ...x, [field]: value } : x)));
  };

  const addItemRow = () => {
    setItemsDraft((prev) => [...prev, { garment_type: null, measurement_id: null, icon_path: null, note: "", quantity: "1", price: "0", handwork: false, customizations: {} }]);
  };

  const removeItemRow = (index: number) => {
    setItemsDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const selectIconFile = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const onRowFileChange = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const uploaded = await uploadOrderItemIcon({ blob: file, fileName: file.name });
      updateItemField(index, "icon_path", uploaded.icon_path);
      toast({ title: "Image uploaded" });
    } catch (err: unknown) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingIndex(null);
    }
  };

  const orderQuery = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => getOrder(orderId),
    enabled: Number.isFinite(orderId),
  });

  const order = orderQuery.data;
  const items = useMemo(() => order?.items ?? [], [order?.items]);

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", order?.customer_id],
    queryFn: () => getCustomer(order!.customer_id),
    enabled: !!order?.customer_id,
  });

  const bodyImageUploadMutation = useMutation({
    mutationFn: async (params: { imageType: string; file: File }) =>
      uploadCustomerBodyImage({
        customerId: order!.customer_id,
        imageType: params.imageType,
        blob: params.file,
        fileName: params.file.name,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", order!.customer_id] });
      toast({ title: "Image uploaded", description: "Client body image uploaded successfully." });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const imageTypes = [
    { key: "full_body", label: "Full Photo" },
    { key: "portrait", label: "Short Photo" },
    { key: "front_body", label: "Front Body" },
    { key: "side_body", label: "Side Body" },
    { key: "shoulder", label: "Shoulder" },
    { key: "back", label: "Back (Body Back)" },
  ];

  const bodyImagesByType = useMemo(() => {
    const map = new Map<string, { id: number; path: string }>();
    for (const img of customerQuery.data?.bodyImages ?? []) {
      map.set(img.image_type, { id: img.id, path: img.image_path });
    }
    return map;
  }, [customerQuery.data?.bodyImages]);

  const openBodyImagePicker = (type: string) => {
    bodyImageRefs.current[type]?.click();
  };

  const handleBodyImagePick = (type: string, file: File | null) => {
    if (!file) return;
    bodyImageUploadMutation.mutate({ imageType: type, file });
  };

  const initDraft = useCallback(() => {
    if (!order) return;
    setFabricDraft(order.fabric ?? "");
    setTrialDateDraft(order.trial_date ? order.trial_date.substring(0, 10) : "");
    setDeliveryDateDraft(order.delivery_date ? order.delivery_date.substring(0, 10) : "");
    setStatusDraft(order.status as any);
    setPriceDraft(order.items?.[0]?.price ? String(Number(order.items[0].price)) : "");
    setNotesDraft(order.notes ?? "");
    setItemsDraft(
      (order.items ?? []).map((it) => {
        let custs: Record<number, { priceModifier: number, note: string }> = {};
        if (it.customization_flags) {
          try {
            custs = JSON.parse(it.customization_flags);
          } catch (e) {
            custs = {};
          }
        }
        return {
          garment_type: it.garment_type ?? null,
          measurement_id: it.measurement_id ?? null,
          icon_path: it.icon_path ?? null,
          note: it.note ?? null,
          quantity: String(1),
          price: "0",
          handwork: !!it.handwork,
          customizations: custs,
        };
      }),
    );
  }, [order]);

  useEffect(() => {
    if (!order) return;
    if (isEditing) return;
    initDraft();
  }, [initDraft, isEditing, order]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextItems = itemsDraft.map((it, i) => {
        return {
          garment_type: it.garment_type,
          measurement_id: it.measurement_id,
          icon_path: it.icon_path,
          note: it.note,
          handwork: it.handwork,
          customization_flags: Object.keys(it.customizations).length > 0 ? JSON.stringify(it.customizations) : null,
          quantity: 1,
          price: i === 0 ? Number(priceDraft) : 0,
        };
      });

      return updateOrder(orderId, {
        fabric: fabricDraft || null,
        trial_date: trialDateDraft || null,
        delivery_date: deliveryDateDraft || null,
        status: statusDraft,
        notes: notesDraft || null,
        items: nextItems,
        customizations: [],
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      toast({ title: "Saved", description: "Order updated." });
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Save failed", description: message || "Unable to update order.", variant: "destructive" });
    },
  });

  if (!Number.isFinite(orderId)) {
    return <div className="p-8 text-center text-muted-foreground">Order not found</div>;
  }

  if (orderQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-muted-foreground">Order not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={order.order_number}
        subtitle={order.customer?.name ?? "—"}
        backTo="/orders"
        isEditing={false}
        actions={
          <Button variant="outline" onClick={() => navigate(`/orders/edit/${orderId}`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Full Order
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Details">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <EditableField label="Order Number" value={order.order_number} isEditing={false} onChange={() => { }} />
              <StatusBadge status={isEditing ? statusDraft : order.status} />
            </div>

            <EditableField label="Customer" value={order.customer?.name ?? "—"} isEditing={false} onChange={() => { }} />

            <div className="pt-2 pb-4">
              <p className="text-xs text-muted-foreground mb-4">Order Status Progress</p>
              <div className="bg-muted/30 border border-border rounded-xl px-2 sm:px-6 py-6 overflow-hidden">
                <OrderStatusStepper 
                  status={isEditing ? statusDraft : order.status} 
                  onChange={(v) => setStatusDraft(v as typeof statusDraft)} 
                  isEditing={isEditing} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trial Date</p>
                {isEditing ? (
                  <DatePicker value={trialDateDraft} onChange={setTrialDateDraft} className="text-sm" />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {order.trial_date ? format(new Date(order.trial_date), "dd-MMM-yyyy") : "—"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Delivery Date</p>
                {isEditing ? (
                  <DatePicker value={deliveryDateDraft} onChange={setDeliveryDateDraft} className="text-sm" />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {order.delivery_date ? format(new Date(order.delivery_date), "dd-MMM-yyyy") : "—"}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Order details are now kept simple and can be refined later.
            </p>

            <div className="space-y-2 rounded-xl border border-border p-3 sm:p-4">
              {isEditing ? (
                <>
                  {itemsDraft.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-6 text-center">{index + 1}.</span>
                        {uploadingIndex === index ? (
                          <div className="h-10 w-10 shrink-0 rounded-md border border-border flex items-center justify-center bg-muted/20">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : item.icon_path ? (
                          <div className="relative h-10 w-10 shrink-0 rounded-md border border-border bg-muted/20 overflow-hidden group">
                            <ImagePreviewDialog src={resolvePublicUrl(item.icon_path)!} alt="Icon">
                              <img src={resolvePublicUrl(item.icon_path) ?? ""} alt="Icon" className="h-full w-full object-cover cursor-pointer" />
                            </ImagePreviewDialog>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectIconFile(index);
                              }}
                              className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in"
                              title="Change image"
                            >
                              <Camera className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => selectIconFile(index)}
                            className="h-10 w-10 shrink-0"
                            title="Upload image"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[index] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          onRowFileChange(index, file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <Input
                          placeholder="Note"
                          value={item.note ?? ""}
                          onChange={(e) => updateItemField(index, "note", e.target.value)}
                          className="w-full"
                        />
                        <div className="flex items-center gap-4 px-1">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.handwork}
                              onChange={(e) => updateItemField(index, "handwork", e.target.checked)}
                              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            Handwork
                          </label>

                          <div className="flex items-center gap-1.5">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Object.keys(item.customizations).length > 0}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    updateItemField(index, "customizations", {});
                                  } else {
                                    setActiveCustomizationRowIndex(index);
                                  }
                                }}
                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              Advanced Customization
                            </label>
                            {Object.keys(item.customizations).length > 0 && (
                              <span 
                                onClick={() => setActiveCustomizationRowIndex(index)}
                                className="text-xs text-primary font-medium hover:underline cursor-pointer"
                              >
                                ({Object.keys(item.customizations)
                                  .map((id) => optionsMap.get(Number(id)) || "")
                                  .filter(Boolean)
                                  .join(", ")})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemRow(index)}
                        disabled={itemsDraft.length <= 1}
                        className="h-10 w-10 shrink-0 text-destructive hover:text-destructive align-top"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </>
              ) : (
                <>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items.</p>
                  ) : (
                    items.map((item, i) => {
                      let flags: string[] = [];
                      if (item.customization_flags) {
                        try {
                          const parsed = JSON.parse(item.customization_flags);
                          flags = Object.keys(parsed)
                            .map((id) => optionsMap.get(Number(id)) || "")
                            .filter(Boolean);
                        } catch (e) {
                          flags = [];
                        }
                      }
                      return (
                        <div key={i} className="flex items-start gap-4 p-2 border border-border rounded-xl bg-muted/10">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground w-6 text-center">{i + 1}.</span>
                            <div className="w-12 h-12 shrink-0 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden border border-border">
                              {item.icon_path ? (
                                <ImagePreviewDialog src={resolvePublicUrl(item.icon_path)!} alt="Icon">
                                  <div className="relative w-full h-full group">
                                    <img src={resolvePublicUrl(item.icon_path) ?? ""} alt="Icon" className="w-full h-full object-cover cursor-pointer" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <Eye className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                </ImagePreviewDialog>
                              ) : (
                                <Camera className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 py-1">
                            <p className="text-sm text-foreground">
                              {item.note || "No note"}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-not-allowed select-none">
                                <input
                                  type="checkbox"
                                  checked={!!item.handwork}
                                  disabled
                                  className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 opacity-70"
                                />
                                Handwork
                              </label>

                              <div className="flex items-center gap-1.5">
                                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-not-allowed select-none">
                                  <input
                                    type="checkbox"
                                    checked={flags.length > 0}
                                    disabled
                                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 opacity-70"
                                  />
                                  Advanced Customization
                                </label>
                                {flags.length > 0 && (
                                  <span className="text-xs text-muted-foreground font-medium">
                                    ({flags.join(", ")})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4 sm:space-y-6">
          <SectionCard title="Notes">
            <div className="space-y-4">
              <div>
                {isEditing ? (
                  <Textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={3} />
                ) : (
                  <p className="text-sm font-medium">{order.notes ?? "No notes"}</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Activity History">
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {!order.activities || order.activities.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity logged yet.</p>
              ) : (
                <div className="relative pl-4 border-l-2 border-muted space-y-5 py-1">
                  {order.activities.map((act) => (
                    <div key={act.id} className="relative flex flex-col gap-0.5">
                      {/* Bullet marker */}
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border border-background" />
                      
                      <p className="text-xs text-foreground">
                        <span className="font-semibold">{act.user?.name ?? "System"}</span>{" "}
                        <span>{act.description}</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(act.created_at), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Add Images Section">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Body Images</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {imageTypes.map((type) => {
              const existing = bodyImagesByType.get(type.key);
              const preview = resolvePublicUrl(existing?.path ?? null);
              const isUploading = bodyImageUploadMutation.isPending && bodyImageUploadMutation.variables?.imageType === type.key;

              return (
                <div key={type.key} className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{type.label}</p>
                  {isUploading ? (
                    <div className="w-full h-28 rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : preview ? (
                    <div className="relative w-full h-28 rounded-lg overflow-hidden group border border-border bg-muted/20">
                      <ImagePreviewDialog src={preview} alt={type.label}>
                        <div className="relative w-full h-full cursor-pointer">
                          <img src={preview} alt={type.label} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Eye className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </ImagePreviewDialog>
                      <button
                        type="button"
                        onClick={() => openBodyImagePicker(type.key)}
                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors z-10"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openBodyImagePicker(type.key)}
                      className="w-full h-28 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <FileImage className="h-4 w-4" />
                        <span className="text-[11px]">Upload</span>
                      </div>
                    </button>
                  )}
                  <input
                    ref={(el) => {
                      bodyImageRefs.current[type.key] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      handleBodyImagePick(type.key, file);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <OrderCustomizationDialog
        open={activeCustomizationRowIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveCustomizationRowIndex(null);
        }}
        selectedOptions={
          activeCustomizationRowIndex !== null
            ? itemsDraft[activeCustomizationRowIndex]?.customizations ?? {}
            : {}
        }
        onSelectionChange={(newCustomizations) => {
          if (activeCustomizationRowIndex !== null) {
            updateItemField(activeCustomizationRowIndex, "customizations", newCustomizations);
          }
        }}
      />
    </div>
  );
}
