import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2, DollarSign, ShoppingBag, Award, Clock } from "lucide-react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { CustomerImageCropDialog } from "@/components/CustomerImageCropDialog";
import { apiBaseUrl } from "@/services/api";
import { deleteCustomerBodyImage, getCustomer, updateCustomer, uploadCustomerBodyImage } from "@/services/customers";

export default function CustomerDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const customerId = id ? Number(id) : NaN;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    birthday: "",
    fitPreference: "",
    notes: "",
  });

  const [cropOpen, setCropOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string>("full_body");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });

  const customer = customerQuery.data;

  const imagesByType = useMemo(() => {
    const map = new Map<string, { id: number; path: string }>();
    for (const img of customer?.bodyImages ?? []) {
      map.set(img.image_type, { id: img.id, path: img.image_path });
    }
    return map;
  }, [customer?.bodyImages]);

  const syncFormFromCustomer = () => {
    if (!customer) return;
    setForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      birthday: customer.birthday ? (customer.birthday.includes('T') ? customer.birthday.split('T')[0] : customer.birthday) : "",
      fitPreference: customer.preference?.fit_preference ?? "",
      notes: customer.preference?.notes ?? "",
    });
  };

  const updateForm = (key: keyof typeof form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const saveMutation = useMutation({
    mutationFn: () =>
      updateCustomer(customerId, {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        birthday: form.birthday || null,
        preferences: {
          fit_preference: form.fitPreference || null,
          notes: form.notes || null,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Saved", description: "Customer updated." });
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Save failed", description: message || "Unable to update customer.", variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (params: { type: string; blob: Blob; fileName: string }) =>
      uploadCustomerBodyImage({ customerId, imageType: params.type, blob: params.blob, fileName: params.fileName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", customerId] });
      toast({ title: "Uploaded", description: "Image uploaded successfully." });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Upload failed", description: message || "Unable to upload image.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (params: { imageId: number }) => deleteCustomerBodyImage({ customerId, imageId: params.imageId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", customerId] });
      toast({ title: "Deleted", description: "Image deleted." });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Delete failed", description: message || "Unable to delete image.", variant: "destructive" });
    },
  });

  if (!Number.isFinite(customerId)) return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;
  if (customerQuery.isLoading) return <div className="p-8 text-center text-muted-foreground">Loading customer...</div>;
  if (!customer) return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;

  const imageTypes = [
    { key: "full_body", label: "Full Photo", aspect: 3 / 4 },
    { key: "portrait", label: "Short Photo", aspect: 1 },
    { key: "front_body", label: "Front Body", aspect: 3 / 4 },
    { key: "side_body", label: "Side Body", aspect: 3 / 4 },
    { key: "shoulder", label: "Shoulder", aspect: 1 },
    { key: "back", label: "Back", aspect: 3 / 4 },
  ];

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.customer_code}
        backTo="/customers"
        isEditing={isEditing}
        onEdit={() => {
          syncFormFromCustomer();
          setIsEditing(true);
        }}
        onSave={() => saveMutation.mutate()}
        onCancel={() => {
          syncFormFromCustomer();
          setIsEditing(false);
        }}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Spent</div>
            <div className="text-lg font-bold">${customer.loyalty?.total_spent ?? '0.00'}</div>
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Orders</div>
            <div className="text-lg font-bold">{customer.orders_count ?? 0}</div>
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Loyalty Points</div>
            <div className="text-lg font-bold">{customer.loyalty?.points ?? 0}</div>
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Last Visit</div>
            <div className="text-lg font-bold">{customer.loyalty?.last_visit ? format(new Date(customer.loyalty.last_visit), "dd-MMM-yyyy") : "—"}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Customer Information">
          <div className="grid sm:grid-cols-2 gap-4">
            <EditableField label="Name" value={isEditing ? form.name : customer.name} isEditing={isEditing} onChange={(v) => updateForm("name", v)} />
            <EditableField label="Phone" value={isEditing ? form.phone : customer.phone ?? ""} isEditing={isEditing} onChange={(v) => updateForm("phone", v)} />
            <EditableField label="Email" value={isEditing ? form.email : customer.email ?? ""} isEditing={isEditing} onChange={(v) => updateForm("email", v)} />
            <EditableField label="Address" value={isEditing ? form.address : customer.address ?? ""} isEditing={isEditing} onChange={(v) => updateForm("address", v)} />
            <EditableField label="Birth Date" value={isEditing ? form.birthday : (customer.birthday ? (customer.birthday.includes('T') ? customer.birthday.split('T')[0] : customer.birthday) : "")} isEditing={isEditing} type="date" onChange={(v) => updateForm("birthday", v)} />
          </div>
        </SectionCard>

        <SectionCard title="Preferences">
          <div className="space-y-4">
            <EditableField
              label="Fit Preferences"
              value={isEditing ? form.fitPreference : customer.preference?.fit_preference ?? ""}
              isEditing={isEditing}
              onChange={(v) => updateForm("fitPreference", v)}
            />
            <EditableField
              label="Notes"
              value={isEditing ? form.notes : customer.preference?.notes ?? ""}
              isEditing={isEditing}
              type="textarea"
              onChange={(v) => updateForm("notes", v)}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Body Images">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {imageTypes.map((t) => {
            const image = imagesByType.get(t.key);
            const src = image ? `${apiBaseUrl()}${image.path}` : null;
            return (
              <div key={t.key} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-medium">{t.label}</div>
                  {src ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : null}
                </div>
                <div className="relative h-40 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                  {src ? <img src={src} alt={t.label} className="h-full w-full object-cover" /> : <div className="text-xs text-muted-foreground">No image</div>}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setPendingType(t.key);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadMutation.isPending}
                  >
                    Upload
                  </Button>
                  {image ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" size="sm" variant="outline" disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete image?</AlertDialogTitle>
                          <AlertDialogDescription>This will remove the image from server and database.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate({ imageId: image.id })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (!file) return;
            setPendingFile(file);
            setCropOpen(true);
          }}
        />

        <CustomerImageCropDialog
          open={cropOpen}
          onOpenChange={setCropOpen}
          file={pendingFile}
          title="Crop customer image"
          aspect={imageTypes.find((t) => t.key === pendingType)?.aspect ?? 3 / 4}
          onConfirm={async (blob) => {
            const name = pendingFile?.name ?? "image.jpg";
            await uploadMutation.mutateAsync({ type: pendingType, blob, fileName: name });
          }}
        />
      </SectionCard>
    </div>
  );
}
