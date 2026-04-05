import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { listCustomers } from "@/services/customers";
import { createMeasurement, listMeasurementFields, listStaff } from "@/services/measurements";

export default function MeasurementNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [garmentType, setGarmentType] = useState<string>("Suit");
  const [takenBy, setTakenBy] = useState<string>("__none__");
  const [notes, setNotes] = useState<string>("");
  const [valuesDraft, setValuesDraft] = useState<Record<number, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    const gt = params.get("garment_type");
    if (cid) setCustomerId(cid);
    if (gt === "Suit" || gt === "Shirt" || gt === "Pants") {
      setGarmentType(gt);
      setValuesDraft({});
    }
  }, [location.search]);

  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
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

  return (
    <div>
      <PageHeader title="New Measurement" subtitle="Create customer measurement record" backTo="/measurements" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Measurement Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Customer *</label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={customersQuery.isLoading ? "Loading customers..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {(customersQuery.data?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Garment Type *</label>
              <Tabs
                value={garmentType}
                onValueChange={(v) => {
                  setGarmentType(v);
                  setValuesDraft({});
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="Suit" className="flex-1">Suit</TabsTrigger>
                  <TabsTrigger value="Shirt" className="flex-1">Shirt</TabsTrigger>
                  <TabsTrigger value="Pants" className="flex-1">Pants</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Taken By</label>
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
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notes">
          <Textarea placeholder="Notes..." rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </SectionCard>
      </div>

      <SectionCard title={`${garmentType} Fields`} className="mb-6">
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
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate("/measurements")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Measurement"}
        </Button>
      </div>
    </div>
  );
}
