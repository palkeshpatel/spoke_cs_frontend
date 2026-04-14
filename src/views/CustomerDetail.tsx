import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2, DollarSign, ShoppingBag, Award, Clock, Ruler } from "lucide-react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Profile & Info */}
        <div className="space-y-6">
          <SectionCard title="">
            <div className="flex flex-col items-center pt-2">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted mb-4">
                {imagesByType.get("full_body") || customer.profile_image ? (
                  <img src={customer.profile_image ? `${apiBaseUrl()}${customer.profile_image}` : `${apiBaseUrl()}${imagesByType.get("full_body")?.path}`} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-muted-foreground">{customer.name.substring(0, 2).toUpperCase()}</div>
                )}
              </div>
              <h2 className="text-xl font-bold">{customer.name}</h2>
              <p className="text-sm text-muted-foreground">{customer.customer_code}</p>
              {customer.vip_status ? (
                <div className="mt-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">VIP</div>
              ) : null}
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
              <div className="space-y-4">
                <EditableField label="Name" value={isEditing ? form.name : customer.name} isEditing={isEditing} onChange={(v) => updateForm("name", v)} />
                <EditableField label="Phone" value={isEditing ? form.phone : customer.phone ?? ""} isEditing={isEditing} onChange={(v) => updateForm("phone", v)} />
                <EditableField label="Email" value={isEditing ? form.email : customer.email ?? ""} isEditing={isEditing} onChange={(v) => updateForm("email", v)} />
                <EditableField label="Address" value={isEditing ? form.address : customer.address ?? ""} isEditing={isEditing} onChange={(v) => updateForm("address", v)} />
                <EditableField label="Birth Date" value={isEditing ? form.birthday : (customer.birthday ? (customer.birthday.includes('T') ? customer.birthday.split('T')[0] : customer.birthday) : "")} isEditing={isEditing} type="date" onChange={(v) => updateForm("birthday", v)} />
              </div>
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

          <SectionCard title="Body Images">
            <div className="grid grid-cols-2 gap-3">
              {imageTypes.map((t) => {
                const image = imagesByType.get(t.key);
                const src = image ? `${apiBaseUrl()}${image.path}` : null;
                return (
                  <div key={t.key} className="border border-border rounded-lg p-2 flex flex-col items-center">
                    <div className="text-xs font-medium w-full truncate text-center mb-1">{t.label}</div>
                    <div className="relative h-24 w-full rounded bg-muted overflow-hidden">
                      {src ? <img src={src} alt={t.label} className="h-full w-full object-cover" /> : null}
                    </div>
                    {isEditing ? (
                      <div className="w-full mt-2">
                        <Button
                          type="button"
                          size="sm"
                          className="w-full h-7 text-[10px]"
                          variant="outline"
                          onClick={() => {
                            setPendingType(t.key);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploadMutation.isPending}
                        >
                          Upload
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="orders">
            <TabsList className="w-full grid grid-cols-4 h-12 rounded-full overflow-hidden p-1 shadow-sm border border-border/50 bg-background mb-4">
              <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-muted">Orders</TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-full data-[state=active]:bg-muted">Appointments</TabsTrigger>
              <TabsTrigger value="measurements" className="rounded-full data-[state=active]:bg-muted">Measurements</TabsTrigger>
              <TabsTrigger value="billing" className="rounded-full data-[state=active]:bg-muted">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="focus-visible:outline-none">
              <SectionCard title="">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">ORD-045</h3>
                      <div className="bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">completed</div>
                    </div>
                    <p className="text-sm text-primary mt-1">Custom 3-Piece Suit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">$850.00</p>
                    <p className="text-xs text-muted-foreground">2026-03-01</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground pb-4 border-b border-border">
                  <p>Fabric: Italian Wool - Navy Blue</p>
                  <p>Delivery: 2026-03-15</p>
                  <p>Notes: Wedding suit - priority order</p>
                </div>
                
                <div className="mt-4 flex justify-between items-start mb-4 opacity-75">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">ORD-032</h3>
                      <div className="bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">completed</div>
                    </div>
                    <p className="text-sm text-primary mt-1">Dress Shirts (x3)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">$120.00</p>
                    <p className="text-xs text-muted-foreground">2025-11-20</p>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="appointments" className="focus-visible:outline-none">
              <SectionCard title="">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Follow-up Fitting</h4>
                      <p className="text-xs text-muted-foreground">2026-03-10 at 2:00 PM</p>
                    </div>
                  </div>
                  <div className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">upcoming</div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border opacity-75">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary/70" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Suit Fitting</h4>
                      <p className="text-xs text-muted-foreground">2026-03-01 at 10:00 AM</p>
                    </div>
                  </div>
                  <div className="bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">completed</div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="measurements" className="focus-visible:outline-none">
              <SectionCard title="">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Ruler className="h-5 w-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Measurement Records</h3>
                    <p className="text-xs text-muted-foreground">Last updated: 2026-03-01</p>
                  </div>
                </div>
                <div className="border-t border-border pt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Chest</p>
                    <p className="font-medium text-lg">42"</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Waist</p>
                    <p className="font-medium text-lg">36"</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sleeve</p>
                    <p className="font-medium text-lg">34"</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Neck</p>
                    <p className="font-medium text-lg">15.5"</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Inseam</p>
                    <p className="font-medium text-lg">32"</p>
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground mb-1">Shoulder</p>
                     <p className="font-medium text-lg">18"</p>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>
            
            <TabsContent value="billing" className="focus-visible:outline-none">
              <SectionCard title="">
                <div className="p-8 text-center text-muted-foreground">
                  No billing history to display.
                </div>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hidden Upload Inputs */}
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
    </div>
  );
}
