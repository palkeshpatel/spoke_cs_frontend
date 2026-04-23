import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Copy, Printer, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelect from "@/components/CustomerSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { isValidEmail } from "@/lib/utils";
import { listCustomers } from "@/services/customers";
import { createCustomer } from "@/services/customers";
import { createMeasurement, getMeasurement, listMeasurementFields, listMeasurements, listStaff, updateMeasurement } from "@/services/measurements";

export default function MeasurementNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const measurementId = params.id ? Number(params.id) : null;
  const isEditMode = measurementId !== null && Number.isFinite(measurementId);

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [customerMode, setCustomerMode] = useState<"select" | "create">("select");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [garmentType, setGarmentType] = useState<string>("Suit");
  const [takenBy, setTakenBy] = useState<string>("__none__");
  const [notes, setNotes] = useState<string>("");
  const [valuesDraft, setValuesDraft] = useState<Record<number, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (isEditMode) return;
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    const gt = params.get("garment_type");
    if (cid) setCustomerId(cid);
    if (gt === "Suit" || gt === "Shirt" || gt === "Pants") {
      setGarmentType(gt);
      setValuesDraft({});
    }
  }, [isEditMode, location.search]);

  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
  });

  const existingCustomerByEmail = useMemo(() => {
    const email = newCustomerEmail.trim().toLowerCase();
    if (!email) return null;
    const list = customersQuery.data?.data ?? [];
    return list.find((c) => (c.email ?? "").trim().toLowerCase() === email) ?? null;
  }, [customersQuery.data, newCustomerEmail]);

  const createCustomerMutation = useMutation({
    mutationFn: () =>
      createCustomer({
        name: newCustomerName.trim(),
        email: newCustomerEmail.trim(),
        phone: newCustomerPhone.trim() ? newCustomerPhone.trim() : null,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setCustomerId(String(created.id));
      setCustomerMode("select");
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      toast({ title: "Customer created", description: `${created.name} was added and selected.` });
    },
    onError: (err: unknown) => {
      const emailError =
        typeof err === "object" &&
        err !== null &&
        "details" in err &&
        typeof (err as { details?: unknown }).details === "object" &&
        (err as { details?: any }).details &&
        (err as { details?: any }).details.errors &&
        Array.isArray((err as { details?: any }).details.errors.email) &&
        (err as { details?: any }).details.errors.email[0]
          ? String((err as { details?: any }).details.errors.email[0])
          : "";
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Create failed", description: emailError || message || "Unable to create customer.", variant: "destructive" });
    },
  });

  const allMeasurementsQuery = useQuery({
    queryKey: ["measurements", "list"],
    queryFn: () => listMeasurements(200),
    enabled: !!customerId,
  });

  const staffQuery = useQuery({
    queryKey: ["staff", "list"],
    queryFn: () => listStaff(),
  });

  const fieldsQuery = useQuery({
    queryKey: ["measurement-fields", garmentType],
    queryFn: () => listMeasurementFields(garmentType),
  });

  const fields = useMemo(() => fieldsQuery.data ?? [], [fieldsQuery.data]);

  const handleGarmentTypeChange = (v: string) => {
    if (isEditMode) {
      if (!customerId) return;
      const existing = allMeasurementsQuery.data?.data.find(
        (m) => m.customer_id === Number(customerId) && m.garment_type.toLowerCase() === v.toLowerCase(),
      );
      if (existing) {
        navigate(`/measurements/${existing.id}`);
      } else {
        navigate(`/measurements/new?customer_id=${customerId}&garment_type=${encodeURIComponent(v)}`);
      }
      return;
    }
    setGarmentType(v);
    setValuesDraft({});
  };

  const measurementQuery = useQuery({
    queryKey: ["measurements", "detail", measurementId],
    queryFn: () => getMeasurement(measurementId as number),
    enabled: isEditMode,
  });

  const measurement = measurementQuery.data;

  useEffect(() => {
    if (!isEditMode) {
      setIsEditing(true);
      return;
    }
    if (!measurement) return;
    setCustomerId(String(measurement.customer_id));
    setGarmentType(measurement.garment_type);
    setTakenBy(measurement.taken_by ? String(measurement.taken_by) : "__none__");
    setNotes(measurement.notes ?? "");
  }, [isEditMode, measurement]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!measurement) return;
    if (fields.length === 0) return;
    const next: Record<number, string> = {};
    const valuesByFieldId = new Map<number, string>();
    for (const v of measurement.values ?? []) {
      if (typeof v.field_id !== "number") continue;
      if (v.value === null || v.value === undefined) continue;
      valuesByFieldId.set(v.field_id, String(v.value));
    }
    for (const f of fields) {
      next[f.id] = valuesByFieldId.get(f.id) ?? "";
    }
    setValuesDraft(next);
  }, [fields, isEditMode, measurement]);

  const createMutation = useMutation({
    mutationFn: createMeasurement,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["measurements"] });
      toast({ title: "Measurement created", description: `Measurement #${created.id} created.` });
      navigate(`/measurements/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Create failed", description: message || "Unable to create measurement.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const values = fields.map((f) => {
        const raw = valuesDraft[f.id] ?? "";
        const num = raw.trim() === "" ? null : Number(raw);
        return { field_id: f.id, value: Number.isFinite(num) ? num : null };
      });
      return updateMeasurement(measurementId as number, {
        taken_by: takenBy !== "__none__" ? Number(takenBy) : null,
        notes: notes || null,
        values,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["measurements"] });
      await queryClient.invalidateQueries({ queryKey: ["measurements", "detail", measurementId] });
      toast({ title: "Saved", description: "Measurement updated." });
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Save failed", description: message || "Unable to update measurement.", variant: "destructive" });
    },
  });

  const submit = () => {
    if (!customerId) {
      toast({ title: "Customer required", description: "Please select customer.", variant: "destructive" });
      return;
    }

    const values = fields.map((f) => {
      const raw = valuesDraft[f.id] ?? "";
      const num = raw.trim() === "" ? null : Number(raw);
      return { field_id: f.id, value: Number.isFinite(num) ? num : null };
    });

    createMutation.mutate({
      customer_id: Number(customerId),
      garment_type: garmentType,
      taken_by: takenBy !== "__none__" ? Number(takenBy) : null,
      notes: notes || null,
      values,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    let text = "label,value\n";
    for (const f of fields) {
      const val = valuesDraft[f.id] || "";
      text += `"${f.field_name}","${val}"\n`;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Measurements copied as CSV" });
    } catch {
      toast({ title: "Failed", description: "Failed to copy", variant: "destructive" });
    }
  };

  const canEdit = !isEditMode || isEditing;

  if (isEditMode && measurementQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading measurement...</div>;
  }

  if (isEditMode && !measurement) {
    return <div className="p-8 text-center text-muted-foreground">Measurement not found</div>;
  }

  return (
    <div className="measurement-print-root">
      {isEditMode ? (
        <PageHeader
          title={measurement?.customer?.name ?? "Measurement"}
          subtitle={`${garmentType} · Updated ${measurement?.updated_at ? format(new Date(measurement.updated_at), "dd-MMM-yyyy") : ""}`}
          backTo="/measurements"
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          persistActions
          actions={
            <Button type="button" variant="outline" size="sm" onClick={handlePrint} title="Print measurement">
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          }
          onCancel={() => {
            if (!measurement) return;
            setTakenBy(measurement.taken_by ? String(measurement.taken_by) : "__none__");
            setNotes(measurement.notes ?? "");
            setGarmentType(measurement.garment_type);
            setCustomerId(String(measurement.customer_id));
            const next: Record<number, string> = {};
            const valuesByFieldId = new Map<number, string>();
            for (const v of measurement.values ?? []) {
              if (typeof v.field_id !== "number") continue;
              if (v.value === null || v.value === undefined) continue;
              valuesByFieldId.set(v.field_id, String(v.value));
            }
            for (const f of fields) {
              next[f.id] = valuesByFieldId.get(f.id) ?? "";
            }
            setValuesDraft(next);
            setIsEditing(false);
          }}
          onSave={() => updateMutation.mutate()}
        />
      ) : (
        <PageHeader title="New Measurement" subtitle="Create customer measurement record" backTo="/measurements" />
      )}

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard
          title="Measurement Details"
          headerActions={
            !isEditMode
              ? customerMode === "select"
                ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setCustomerMode("create")} className="h-8">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )
                : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomerMode("select");
                      setNewCustomerName("");
                      setNewCustomerEmail("");
                      setNewCustomerPhone("");
                    }}
                    className="h-8"
                  >
                    Choose existing
                  </Button>
                )
              : null
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Customer *</label>
              {isEditMode ? (
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm">
                  {measurement?.customer ? `${measurement.customer.name} (${measurement.customer.customer_code})` : "—"}
                </div>
              ) : customerMode === "create" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                    <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Customer name" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                      <Input value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="email@example.com" />
                      {existingCustomerByEmail ? (
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <span className="font-medium text-amber-900">Email already exists</span>
                            <span className="text-amber-800"> for </span>
                            <span className="text-amber-900 truncate">{existingCustomerByEmail.name}</span>
                            <span className="text-amber-800"> ({existingCustomerByEmail.customer_code})</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => {
                              setCustomerId(String(existingCustomerByEmail.id));
                              setCustomerMode("select");
                              setNewCustomerName("");
                              setNewCustomerEmail("");
                              setNewCustomerPhone("");
                              toast({ title: "Selected existing customer", description: `${existingCustomerByEmail.name} selected.` });
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                      <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Phone number" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCustomerMode("select");
                        setNewCustomerName("");
                        setNewCustomerEmail("");
                        setNewCustomerPhone("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!newCustomerName.trim()) {
                          toast({ title: "Name required", description: "Please enter the customer name.", variant: "destructive" });
                          return;
                        }
                        if (!isValidEmail(newCustomerEmail)) {
                          toast({ title: "Email required", description: "Please enter a valid email address.", variant: "destructive" });
                          return;
                        }
                        if (existingCustomerByEmail) {
                          toast({ title: "Email already used", description: "This email is already linked to an existing customer. Please select that customer.", variant: "destructive" });
                          return;
                        }
                        createCustomerMutation.mutate();
                      }}
                      disabled={createCustomerMutation.isPending}
                    >
                      {createCustomerMutation.isPending ? "Saving..." : "Save customer"}
                    </Button>
                  </div>
                </div>
              ) : (
                <CustomerSelect
                  customers={customersQuery.data?.data || []}
                  value={customerId}
                  onChange={setCustomerId}
                  isLoading={customersQuery.isLoading}
                />
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Taken By</label>
              {canEdit ? (
                <Select value={takenBy} onValueChange={setTakenBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {(staffQuery.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm">
                  {measurement?.taker?.name ?? "—"}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notes">
          <Textarea
            placeholder="Notes..."
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canEdit}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Fields"
        className="mb-6"
        headerActions={
          isEditMode && !isEditing ? (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 p-2" title="Copy CSV">
              <Copy className="h-4 w-4" />
            </Button>
          ) : null
        }
      >
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-2 block">Garment Type *</label>
          <Tabs value={garmentType} onValueChange={handleGarmentTypeChange}>
            <TabsList className="w-full">
              <TabsTrigger value="Suit" className="flex-1">
                Suit
              </TabsTrigger>
              <TabsTrigger value="Shirt" className="flex-1">
                Shirt
              </TabsTrigger>
              <TabsTrigger value="Pants" className="flex-1">
                Pants
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {fieldsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading fields...</div>
        ) : fields.length === 0 ? (
          <div className="text-sm text-muted-foreground">No fields configured for {garmentType}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {fields.map((f) => (
              <div key={f.id} className="space-y-1">
                <div className="text-xs text-muted-foreground">{f.field_name}</div>
                <Input
                  type="number"
                  value={valuesDraft[f.id] ?? ""}
                  onChange={(e) => setValuesDraft((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder={f.unit}
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {!isEditMode ? (
        <div className="flex gap-2 justify-end print:hidden">
          <Button variant="cancel" onClick={() => navigate("/measurements")}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Measurement"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
