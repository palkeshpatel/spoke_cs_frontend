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
import { Camera, FileImage, Loader2, Plus, Trash2 } from "lucide-react";
import { OrderCustomizationDialog } from "@/components/OrderCustomizationDialog";

type ItemDraft = {
  garment_type: string | null;
  measurement_id: number | null;
  icon_path: string | null;
  note: string | null;
  quantity: string;
  price: string;
};

export default function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const orderId = id ? Number(id) : NaN;

  const [isEditing, setIsEditing] = useState(false);
  const [fabricDraft, setFabricDraft] = useState("");
  const [trialDateDraft, setTrialDateDraft] = useState("");
  const [deliveryDateDraft, setDeliveryDateDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<"pending" | "in_progress" | "trial" | "completed" | "delivered">("pending");
  const [priceDraft, setPriceDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [itemsDraft, setItemsDraft] = useState<ItemDraft[]>([]);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const bodyImageRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<number, { priceModifier: number, note: string }>>({});

  const updateItemField = (index: number, field: keyof ItemDraft, value: string | null) => {
    setItemsDraft((prev) => prev.map((x, i) => (i === index ? { ...x, [field]: value } : x)));
  };

  const addItemRow = () => {
    setItemsDraft((prev) => [...prev, { garment_type: null, measurement_id: null, icon_path: null, note: "", quantity: "1", price: "0" }]);
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
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", order?.customer_id] });
      toast({ title: "Image uploaded", description: "Client body image uploaded successfully." });
    },
    onError: () => toast({ title: "Upload failed", variant: "destructive" }),
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
    setTrialDateDraft(order.trial_date ?? "");
    setDeliveryDateDraft(order.delivery_date ?? "");
    setStatusDraft(order.status ?? "pending");
    setPriceDraft(typeof order.items?.[0]?.price === "string" ? order.items[0].price : String(order.items?.[0]?.price ?? 0));
    setNotesDraft(order.notes ?? "");
    setItemsDraft(
      (order.items ?? []).map((it) => ({
        garment_type: it.garment_type ?? null,
        measurement_id: it.measurement_id ?? null,
        icon_path: it.icon_path ?? null,
        note: it.note ?? null,
        quantity: String(1),
        price: "0",
      })),
    );

    const custMap: Record<number, { priceModifier: number, note: string }> = {};
    if (order.customizations) {
      order.customizations.forEach((c: any) => {
        custMap[c.option_id] = { priceModifier: Number(c.price_modifier), note: c.note || "" };
      });
    }
    setSelectedCustomizations(custMap);
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
        customizations: Object.entries(selectedCustomizations).map(([optId, data]) => ({
          option_id: Number(optId),
          price_modifier: Number(data.priceModifier),
          note: data.note || null,
        })),
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
        isEditing={isEditing}
        onEdit={() => {
          initDraft();
          setIsEditing(true);
        }}
        onSave={() => saveMutation.mutate()}
        onCancel={() => {
          initDraft();
          setIsEditing(false);
        }}
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Details">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <EditableField label="Order Number" value={order.order_number} isEditing={false} onChange={() => { }} />
              <StatusBadge status={isEditing ? statusDraft : order.status} />
            </div>

            <EditableField label="Customer" value={order.customer?.name ?? "—"} isEditing={false} onChange={() => { }} />

            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Status"
                value={isEditing ? statusDraft : order.status}
                isEditing={isEditing}
                type="select"
                options={[
                  { value: "pending", label: "pending" },
                  { value: "in_progress", label: "in_progress" },
                  { value: "trial", label: "trial" },
                  { value: "completed", label: "completed" },
                  { value: "delivered", label: "delivered" },
                ]}
                onChange={(v) => setStatusDraft(v as typeof statusDraft)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trial Date</p>
                {isEditing ? (
                  <Input type="date" value={trialDateDraft} onChange={(e) => setTrialDateDraft(e.target.value)} className="text-sm" />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {order.trial_date ? format(new Date(order.trial_date), "dd-MMM-yyyy") : "—"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Delivery Date</p>
                {isEditing ? (
                  <Input type="date" value={deliveryDateDraft} onChange={(e) => setDeliveryDateDraft(e.target.value)} className="text-sm" />
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
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => selectIconFile(index)}
                          className="h-10 w-10 shrink-0"
                          title="Upload image"
                        >
                          {uploadingIndex === index ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : item.icon_path ? (
                            <img src={resolvePublicUrl(item.icon_path) ?? ""} alt="Icon" className="h-full w-full rounded object-cover" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </Button>
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
                      <Input
                        placeholder="Note"
                        value={item.note ?? ""}
                        onChange={(e) => updateItemField(index, "note", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemRow(index)}
                        disabled={itemsDraft.length <= 1}
                        className="h-10 w-10 shrink-0 text-destructive hover:text-destructive"
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
                    items.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-2 border border-border rounded-xl bg-muted/10">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-6 text-center">{i + 1}.</span>
                          <div className="w-12 h-12 shrink-0 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden border border-border">
                            {item.icon_path ? (
                              <img src={resolvePublicUrl(item.icon_path) ?? ""} alt="Icon" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">{item.note || "No note"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notes">
          <div className="space-y-4">

            <div>
              {isEditing ? (
                <Textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={3} />
              ) : (
                <p className="text-sm font-medium">{order.notes ?? "No notes"}</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCustomizationModalOpen(true)}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 transition-colors"
              >
                Advance Customisation
                <span className="flex items-center justify-center w-4 h-4 rounded-full border border-primary text-[10px] font-bold">?</span>
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Add Images Section (Client Selfy Pics)">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Body Images</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {imageTypes.map((type) => {
              const existing = bodyImagesByType.get(type.key);
              const preview = resolvePublicUrl(existing?.path ?? null);
              const isUploading = bodyImageUploadMutation.isPending && bodyImageUploadMutation.variables?.imageType === type.key;

              return (
                <div key={type.key} className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{type.label}</p>
                  <button
                    type="button"
                    onClick={() => openBodyImagePicker(type.key)}
                    className="w-full h-28 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden hover:bg-muted/40 transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : preview ? (
                      <img src={preview} alt={type.label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <FileImage className="h-4 w-4" />
                        <span className="text-[11px]">Upload</span>
                      </div>
                    )}
                  </button>
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
        open={customizationModalOpen}
        onOpenChange={setCustomizationModalOpen}
        selectedOptions={selectedCustomizations}
        onSelectionChange={(s) => {
          if (!isEditing) {
            toast({ title: "Read-only mode", description: "Click Edit to change customisations.", variant: "destructive" });
            return;
          }
          setSelectedCustomizations(s);
        }}
      />
    </div>
  );
}
