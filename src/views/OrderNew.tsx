import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, FileImage, Loader2, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelectWithAdd from "@/components/CustomerSelectWithAdd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createOrder, uploadOrderItemIcon } from "@/services/orders";
import { resolvePublicUrl } from "@/services/api";
import { getCustomer, uploadCustomerBodyImage } from "@/services/customers";
import { OrderCustomizationDialog } from "@/components/OrderCustomizationDialog";
import DatePicker from "@/components/DatePicker";

type ItemDetailRow = {
  icon_path: string | null;
  note: string;
  isUploading: boolean;
};

export default function OrderNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [fabric, setFabric] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<"pending" | "in_progress" | "trial" | "completed" | "delivered">("pending");
  const [trialDate, setTrialDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [detailRows, setDetailRows] = useState<ItemDetailRow[]>([{ icon_path: null, note: "", isUploading: false }]);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const bodyImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<number, { priceModifier: number, note: string }>>({});

  const selectedCustomerId = customerId ? Number(customerId) : NaN;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    if (cid) setCustomerId(cid);
  }, [location.search]);

  const updateRowNote = (index: number, value: string) => {
    setDetailRows((prev) => prev.map((row, i) => (i === index ? { ...row, note: value } : row)));
  };

  const addDetailRow = () => {
    setDetailRows((prev) => [...prev, { icon_path: null, note: "", isUploading: false }]);
  };

  const removeDetailRow = (index: number) => {
    setDetailRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const selectIconFile = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const onRowFileChange = async (index: number, file: File | null) => {
    if (!file) return;
    setDetailRows((prev) => prev.map((row, i) => (i === index ? { ...row, isUploading: true } : row)));

    try {
      const uploaded = await uploadOrderItemIcon({ blob: file, fileName: file.name });
      setDetailRows((prev) =>
        prev.map((row, i) =>
          i === index ? { ...row, icon_path: uploaded.icon_path, isUploading: false } : row,
        ),
      );
      toast({
        title: "Image uploaded",
        description: "Item icon uploaded successfully.",
      });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      setDetailRows((prev) => prev.map((row, i) => (i === index ? { ...row, isUploading: false } : row)));
      toast({
        title: "Upload failed",
        description: message || "Unable to upload icon image.",
        variant: "destructive",
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Order created",
        description: `Order #${created.order_number} created.`,
      });
      navigate(`/orders/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      toast({
        title: "Create failed",
        description: message || "Unable to create order.",
        variant: "destructive",
      });
    },
  });

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", selectedCustomerId],
    queryFn: () => getCustomer(selectedCustomerId),
    enabled: Number.isFinite(selectedCustomerId),
  });

  const bodyImageUploadMutation = useMutation({
    mutationFn: async (params: { imageType: string; file: File }) =>
      uploadCustomerBodyImage({
        customerId: selectedCustomerId,
        imageType: params.imageType,
        blob: params.file,
        fileName: params.file.name,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", selectedCustomerId] });
      toast({
        title: "Image uploaded",
        description: "Client body image uploaded successfully.",
      });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      toast({
        title: "Upload failed",
        description: message || "Unable to upload body image.",
        variant: "destructive",
      });
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
    if (!Number.isFinite(selectedCustomerId)) {
      toast({
        title: "Select customer first",
        description: "Please select customer before uploading images.",
        variant: "destructive",
      });
      return;
    }
    bodyImageRefs.current[type]?.click();
  };

  const handleBodyImagePick = (type: string, file: File | null) => {
    if (!file) return;
    bodyImageUploadMutation.mutate({ imageType: type, file });
  };

  const submit = () => {
    if (!customerId) {
      toast({
        title: "Customer required",
        description: "Please select customer.",
        variant: "destructive",
      });
      return;
    }

    const p = price.trim() === "" ? 0 : Number(price);
    const rows = detailRows.length > 0 ? detailRows : [{ icon_path: null, note: "", isUploading: false }];
    createMutation.mutate({
      customer_id: Number(customerId),
      fabric: fabric || null,
      notes: notes || null,
      status: status,
      trial_date: trialDate || null,
      delivery_date: deliveryDate || null,
      items: rows.map((row, index) => ({
        garment_type: null,
        quantity: 1,
        price: index === 0 && Number.isFinite(p) ? p : 0,
        icon_path: row.icon_path,
        note: row.note.trim() || null,
      })),
      customizations: Object.entries(selectedCustomizations).map(([optId, data]) => ({
        option_id: Number(optId),
        price_modifier: Number(data.priceModifier),
        note: data.note || null,
      })),
    });
  };

  return (
    <div>
      <PageHeader
        title="New Order"
        subtitle="Create a new order"
        backTo="/orders"
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Customer *
              </label>
              <CustomerSelectWithAdd
                value={customerId}
                onChange={setCustomerId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pending">pending</option>
                  <option value="in_progress">in_progress</option>
                  <option value="trial">trial</option>
                  <option value="completed">completed</option>
                  <option value="delivered">delivered</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trial Date</label>
                <DatePicker value={trialDate} onChange={setTrialDate} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Delivery Date</label>
                <DatePicker value={deliveryDate} onChange={setDeliveryDate} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Order details are now kept simple and can be refined later.
            </p>

            <div className="space-y-2 rounded-xl border border-border p-3 sm:p-4">
              {detailRows.map((row, index) => (
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
                      {row.isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : row.icon_path ? (
                        <img src={resolvePublicUrl(row.icon_path) ?? ""} alt="Icon" className="h-full w-full rounded object-cover" />
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
                    value={row.note}
                    onChange={(e) => updateRowNote(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDetailRow(index)}
                    disabled={detailRows.length <= 1}
                    className="h-10 w-10 shrink-0 text-destructive hover:text-destructive"
                    title="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addDetailRow} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notes">
          <div className="space-y-4">

            <div>
              <Textarea
                placeholder="Add order notes..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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

      <div className="flex gap-2 justify-end">
        <Button variant="cancel" onClick={() => navigate("/orders")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Order"}
        </Button>
      </div>

      <OrderCustomizationDialog
        open={customizationModalOpen}
        onOpenChange={setCustomizationModalOpen}
        selectedOptions={selectedCustomizations}
        onSelectionChange={setSelectedCustomizations}
      />
    </div>
  );
}
