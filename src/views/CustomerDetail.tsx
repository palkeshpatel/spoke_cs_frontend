import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, DollarSign, Mail, Receipt, ShoppingBag, Award, Clock, Ruler } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { isValidPhone10, phoneFromStorage, phoneToStorage } from "@/lib/phone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { CustomerImageCropDialog } from "@/components/CustomerImageCropDialog";
import { resolvePublicUrl } from "@/services/api";
import { listAppointments } from "@/services/appointments";
import {
  deleteCustomerBodyImage,
  getCustomer,
  updateCustomer,
  uploadCustomerBodyImage,
  uploadCustomerProfileImage,
} from "@/services/customers";
import { listInvoices } from "@/services/invoices";
import { listMeasurements, type MeasurementDto } from "@/services/measurements";
import { listOrders, type OrderDto } from "@/services/orders";

function sumOrderItems(order: OrderDto): number {
  const items = order.items ?? [];
  return items.reduce((sum, it) => {
    const priceNum = typeof it.price === "string" ? Number(it.price) : Number(it.price);
    const qty = Number(it.quantity ?? 0);
    return sum + (Number.isFinite(priceNum) ? priceNum : 0) * (Number.isFinite(qty) ? qty : 0);
  }, 0);
}

function formatAppointmentTime(t: string | null | undefined): string {
  if (!t) return "—";
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return t;
}

function priorityLabel(p: string): "HIGH" | "NORMAL" | "LOW" {
  if (p === "high") return "HIGH";
  if (p === "low") return "LOW";
  return "NORMAL";
}

const customerDetailTabTriggerClass =
  "rounded-full text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:text-foreground";

function measurementEditPathForCustomer(measurements: MeasurementDto[], cid: number): string {
  const byGarment: Partial<Record<"Suit" | "Shirt" | "Pants", MeasurementDto>> = {};
  for (const m of measurements) {
    const g = m.garment_type as "Suit" | "Shirt" | "Pants";
    if (g !== "Suit" && g !== "Shirt" && g !== "Pants") continue;
    const cur = byGarment[g];
    if (!cur || Number(m.id) > Number(cur.id)) {
      byGarment[g] = m;
    }
  }
  const first = byGarment.Suit ?? byGarment.Shirt ?? byGarment.Pants;
  if (first) return `/measurements/${first.id}`;
  return `/measurements/new?customer_id=${cid}`;
}

function measurementPreview(m: MeasurementDto, maxFields: number) {
  const vals = m.values ?? [];
  return vals.slice(0, maxFields).map((v) => ({
    label: v.field?.field_name ?? `Field ${v.field_id}`,
    value: v.value === null || v.value === undefined || v.value === "" ? "—" : String(v.value),
    unit: v.field?.unit ? ` ${v.field.unit}` : "",
  }));
}

export default function CustomerDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const customerId = id ? Number(id) : NaN;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);

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
  const [profileCropOpen, setProfileCropOpen] = useState(false);
  const [profilePickFile, setProfilePickFile] = useState<File | null>(null);

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });

  const customerOrdersQuery = useQuery({
    queryKey: ["orders", "customer", customerId],
    queryFn: () => listOrders(200, customerId),
    enabled: Number.isFinite(customerId),
  });

  const customerAppointmentsQuery = useQuery({
    queryKey: ["appointments", "customer", customerId],
    queryFn: () => listAppointments(200, customerId),
    enabled: Number.isFinite(customerId),
  });

  const customerMeasurementsQuery = useQuery({
    queryKey: ["measurements", "customer", customerId],
    queryFn: () => listMeasurements(200, customerId),
    enabled: Number.isFinite(customerId),
  });

  const customerInvoicesQuery = useQuery({
    queryKey: ["invoices", "customer", customerId],
    queryFn: () => listInvoices(200, customerId),
    enabled: Number.isFinite(customerId),
  });

  const customer = customerQuery.data;

  const orderStats = useMemo(() => {
    const rows = customerOrdersQuery.data?.data ?? [];
    const count = customerOrdersQuery.data?.total ?? rows.length;
    const spent = rows.reduce((s, o) => s + sumOrderItems(o), 0);
    return { count, spent };
  }, [customerOrdersQuery.data]);

  const measurementEditPath = useMemo(() => {
    if (!Number.isFinite(customerId)) return "/measurements/new";
    const rows = customerMeasurementsQuery.data?.data ?? [];
    return measurementEditPathForCustomer(rows, customerId);
  }, [customerMeasurementsQuery.data, customerId]);

  const mailtoHref = useMemo(() => {
    if (!customer?.email?.trim()) return null;
    const subject = encodeURIComponent(`SPOKE — ${customer.name}`);
    return `mailto:${encodeURIComponent(customer.email.trim())}?subject=${subject}`;
  }, [customer?.email, customer?.name]);

  const imagesByType = useMemo(() => {
    const map = new Map<string, { id: number; path: string }>();
    for (const img of customer?.bodyImages ?? []) {
      map.set(img.image_type, { id: img.id, path: img.image_path });
    }
    return map;
  }, [customer?.bodyImages]);

  const profilePhotoUrl = useMemo(() => {
    if (!customer) return null;
    return resolvePublicUrl(customer.profile_image) ?? resolvePublicUrl(imagesByType.get("full_body")?.path ?? null);
  }, [customer, imagesByType]);

  const syncFormFromCustomer = () => {
    if (!customer) return;
    setForm({
      name: customer.name ?? "",
      phone: phoneFromStorage(customer.phone),
      email: customer.email ?? "",
      address: customer.address ?? "",
      birthday: customer.birthday ? (customer.birthday.includes('T') ? customer.birthday.split('T')[0] : customer.birthday) : "",
      fitPreference: customer.preference?.fit_preference ?? "",
      notes: customer.preference?.notes ?? "",
    });
  };

  const updateForm = (key: keyof typeof form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form.phone.trim()) {
        throw new Error("Please enter a phone number.");
      }
      if (!isValidPhone10(form.phone)) {
        throw new Error("Phone must be exactly 10 digits (XXX-XXX-XXXX).");
      }
      return updateCustomer(customerId, {
        name: form.name,
        phone: phoneToStorage(form.phone) || null,
        email: form.email || null,
        address: form.address || null,
        birthday: form.birthday || null,
        preferences: {
          fit_preference: form.fitPreference || null,
          notes: form.notes || null,
        },
      });
    },
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

  const profileUploadMutation = useMutation({
    mutationFn: async (params: { blob: Blob; fileName: string }) =>
      uploadCustomerProfileImage({ customerId, blob: params.blob, fileName: params.fileName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["customers", "detail", customerId] });
      toast({ title: "Profile photo updated", description: "The profile image was saved." });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Upload failed", description: message || "Unable to upload profile image.", variant: "destructive" });
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
            <div className="text-lg font-bold">
              $
              {customerOrdersQuery.isSuccess
                ? orderStats.spent.toFixed(2)
                : Number(customer.loyalty?.total_spent ?? 0).toFixed(2)}
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Orders</div>
            <div className="text-lg font-bold">
              {customerOrdersQuery.isSuccess ? orderStats.count : customer.orders_count ?? 0}
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5 text-primary" />
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
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted mb-3">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-muted-foreground">{customer.name.substring(0, 2).toUpperCase()}</div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mb-3 h-8 text-xs"
                disabled={profileUploadMutation.isPending}
                onClick={() => profileAvatarInputRef.current?.click()}
              >
                {profileUploadMutation.isPending ? "Uploading…" : "Change profile photo"}
              </Button>
              <input
                ref={profileAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  if (!file) return;
                  setProfilePickFile(file);
                  setProfileCropOpen(true);
                }}
              />
              <div className="text-[11px] text-muted-foreground text-center space-y-0.5 mb-2 w-full max-w-[220px]">
                <p>Added {customer.created_at ? format(new Date(customer.created_at), "dd MMM yyyy, HH:mm") : "—"}</p>
                <p>Last updated {customer.updated_at ? format(new Date(customer.updated_at), "dd MMM yyyy, HH:mm") : "—"}</p>
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
                <EditableField label="Phone" value={isEditing ? form.phone : phoneFromStorage(customer.phone)} isEditing={isEditing} type="phone" onChange={(v) => updateForm("phone", v)} />
                <EditableField label="Email" value={isEditing ? form.email : customer.email ?? ""} isEditing={isEditing} onChange={(v) => updateForm("email", v)} />
                <EditableField label="Address" value={isEditing ? form.address : customer.address ?? ""} isEditing={isEditing} onChange={(v) => updateForm("address", v)} />
                <EditableField label="Birth Date" value={isEditing ? form.birthday : (customer.birthday ? (customer.birthday.includes('T') ? customer.birthday.split('T')[0] : customer.birthday) : "")} isEditing={isEditing} type="date" onChange={(v) => updateForm("birthday", v)} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Loyalty Program">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Points Balance</span>
                <span className="font-bold text-lg text-primary">{customer.loyalty?.points ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="font-bold">${Number(customer.loyalty?.total_spent ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Visit</span>
                <span className="font-medium">{customer.loyalty?.last_visit ? format(new Date(customer.loyalty.last_visit), "dd-MMM-yyyy") : "—"}</span>
              </div>
              {customer.vip_status ? (
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Status</span>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">VIP</span>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>

        {/* Right column: tabs, quick actions under tab panel, then body images */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="orders">
            <TabsList className="w-full grid grid-cols-4 h-12 gap-1 rounded-full border border-border/60 bg-muted/50 p-1 shadow-sm mb-4">
              <TabsTrigger value="orders" className={customerDetailTabTriggerClass}>
                Orders
              </TabsTrigger>
              <TabsTrigger value="appointments" className={customerDetailTabTriggerClass}>
                Appointments
              </TabsTrigger>
              <TabsTrigger value="measurements" className={customerDetailTabTriggerClass}>
                Measurements
              </TabsTrigger>
              <TabsTrigger value="billing" className={customerDetailTabTriggerClass}>
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="focus-visible:outline-none">
              <SectionCard title="Orders for this customer">
                {customerOrdersQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading orders…</p>
                ) : (customerOrdersQuery.data?.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No orders yet for this customer.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {(customerOrdersQuery.data?.data ?? []).map((o) => {
                      const lineTotal = sumOrderItems(o);
                      return (
                        <Link
                          key={o.id}
                          to={`/orders/${o.id}`}
                          className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">{o.order_number}</span>
                                <StatusBadge status={o.status} />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">${lineTotal.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {o.created_at ? format(new Date(o.created_at), "dd MMM yyyy") : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {o.fabric ? <p>Fabric: {o.fabric}</p> : null}
                            {o.notes ? <p>Notes: {o.notes}</p> : null}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="appointments" className="focus-visible:outline-none">
              <SectionCard title="Appointments for this customer">
                {customerAppointmentsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading appointments…</p>
                ) : (customerAppointmentsQuery.data?.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No appointments scheduled for this customer.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {(customerAppointmentsQuery.data?.data ?? []).map((a) => (
                      <Link
                        key={a.id}
                        to={`/appointments/${a.id}`}
                        className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate bg-gradient-to-r from-primary/10 to-accent/10 px-2 py-1 rounded-md inline-block">{a.service_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.appointment_date ? format(new Date(a.appointment_date), "dd MMM yyyy") : "—"}
                              {a.appointment_time ? ` · ${formatAppointmentTime(a.appointment_time)}` : ""}
                              {a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge status={a.status} />
                          <PriorityBadge priority={priorityLabel(a.priority)} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="measurements" className="focus-visible:outline-none">
              <SectionCard title="Measurements for this customer">
                {customerMeasurementsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading measurements…</p>
                ) : (customerMeasurementsQuery.data?.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No measurement sheets on file for this customer.</p>
                ) : (
                  <div className="space-y-4">
                    {(customerMeasurementsQuery.data?.data ?? []).map((m) => {
                      const preview = measurementPreview(m, 8);
                      return (
                        <Link
                          key={m.id}
                          to={`/measurements/${m.id}`}
                          className="block rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                              <Ruler className="h-5 w-5 text-pink-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">{m.garment_type}</p>
                              <p className="text-xs text-muted-foreground">
                                Updated {m.updated_at ? format(new Date(m.updated_at), "dd MMM yyyy, HH:mm") : "—"}
                                {m.taker?.name ? ` · ${m.taker.name}` : ""}
                              </p>
                              {preview.length > 0 ? (
                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                                  {preview.map((row, idx) => (
                                    <div key={`${m.id}-${idx}`}>
                                      <p className="text-muted-foreground truncate">{row.label}</p>
                                      <p className="font-medium truncate">
                                        {row.value}
                                        {row.unit}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-2">No field values recorded yet.</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="billing" className="focus-visible:outline-none">
              <SectionCard title="Invoices for this customer">
                {customerInvoicesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading invoices…</p>
                ) : (customerInvoicesQuery.data?.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No invoices found for this customer.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {(customerInvoicesQuery.data?.data ?? []).map((inv) => {
                      const total = typeof inv.grand_total === "string" ? Number(inv.grand_total) : Number(inv.grand_total);
                      return (
                        <Link
                          key={inv.id}
                          to={`/billing/${inv.id}`}
                          className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">{inv.invoice_number}</span>
                              <StatusBadge status={inv.status} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}
                              {inv.order?.order_number ? ` · ${inv.order.order_number}` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-bold shrink-0">${Number.isFinite(total) ? total.toFixed(2) : "0.00"}</p>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </TabsContent>
          </Tabs>

          <SectionCard title="Body Images">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageTypes.map((t) => {
                const image = imagesByType.get(t.key);
                const src = image ? resolvePublicUrl(image.path) : null;
                return (
                  <div key={t.key} className="border border-border rounded-lg p-2 flex flex-col items-center">
                    <div className="text-xs font-medium w-full truncate text-center mb-1">{t.label}</div>
                    <div className="relative h-28 sm:h-32 w-full rounded bg-muted overflow-hidden">
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

          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button asChild variant="outline" className="h-auto min-h-[4.5rem] flex-col gap-1.5 py-3 px-2">
                <Link to={`/appointments/new?customer_id=${customerId}`}>
                  <Calendar className="h-5 w-5 shrink-0" />
                  <span className="text-center text-[11px] font-semibold leading-tight">New Appointment</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto min-h-[4.5rem] flex-col gap-1.5 py-3 px-2">
                <Link to={`/billing/new?customer_id=${customerId}`}>
                  <Receipt className="h-5 w-5 shrink-0" />
                  <span className="text-center text-[11px] font-semibold leading-tight">New Invoice</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto min-h-[4.5rem] flex-col gap-1.5 py-3 px-2">
                <Link to={measurementEditPath}>
                  <Ruler className="h-5 w-5 shrink-0" />
                  <span className="text-center text-[11px] font-semibold leading-tight">Update Measurements</span>
                </Link>
              </Button>
              {mailtoHref ? (
                <Button asChild variant="outline" className="h-auto min-h-[4.5rem] flex-col gap-1.5 py-3 px-2">
                  <a href={mailtoHref}>
                    <Mail className="h-5 w-5 shrink-0" />
                    <span className="text-center text-[11px] font-semibold leading-tight">Send Message</span>
                  </a>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="Add an email address to the customer to send a message"
                  className="h-auto min-h-[4.5rem] flex-col gap-1.5 py-3 px-2"
                >
                  <Mail className="h-5 w-5 shrink-0 opacity-50" />
                  <span className="text-center text-[11px] font-semibold leading-tight text-muted-foreground">Send Message</span>
                </Button>
              )}
            </div>
          </SectionCard>
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

        <CustomerImageCropDialog
          open={profileCropOpen}
          onOpenChange={setProfileCropOpen}
          file={profilePickFile}
          title="Crop profile photo"
          aspect={1}
          onConfirm={async (blob) => {
            const name = profilePickFile?.name ?? "profile.jpg";
            await profileUploadMutation.mutateAsync({ blob, fileName: name });
          }}
        />
    </div>
  );
}
