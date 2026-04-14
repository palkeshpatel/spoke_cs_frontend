import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getMeasurement, listMeasurementFields, listStaff, updateMeasurement } from "@/services/measurements";

export default function MeasurementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const measurementId = id ? Number(id) : NaN;
  const [isEditing, setIsEditing] = useState(false);
  const [valuesDraft, setValuesDraft] = useState<Record<number, string>>({});
  const [notesDraft, setNotesDraft] = useState("");
  const [takenByDraft, setTakenByDraft] = useState<string>("__none__");

  const measurementQuery = useQuery({
    queryKey: ["measurements", "detail", measurementId],
    queryFn: () => getMeasurement(measurementId),
    enabled: Number.isFinite(measurementId),
  });

  const measurement = measurementQuery.data;

  const allMeasurementsQuery = useQuery({
    queryKey: ["measurements", "list"],
    queryFn: () => listMeasurements(200),
    enabled: !!measurement?.customer_id,
  });

  const staffQuery = useQuery({
    queryKey: ["staff", "list"],
    queryFn: () => listStaff(),
  });

  const fieldsQuery = useQuery({
    queryKey: ["measurement-fields", measurement?.garment_type],
    queryFn: () => listMeasurementFields(measurement?.garment_type),
    enabled: !!measurement?.garment_type,
  });

  const fields = useMemo(() => fieldsQuery.data ?? [], [fieldsQuery.data]);

  const valuesByFieldId = useMemo(() => {
    const map = new Map<number, string>();
    for (const v of measurement?.values ?? []) {
      if (typeof v.field_id !== "number") continue;
      if (v.value === null || v.value === undefined) continue;
      map.set(v.field_id, String(v.value));
    }
    return map;
  }, [measurement?.values]);

  const initDraft = useCallback(() => {
    if (!measurement) return;
    const next: Record<number, string> = {};
    for (const f of fields) {
      const existing = valuesByFieldId.get(f.id);
      next[f.id] = existing ?? "";
    }
    setValuesDraft(next);
    setNotesDraft(measurement.notes ?? "");
    setTakenByDraft(measurement.taken_by ? String(measurement.taken_by) : "__none__");
  }, [fields, measurement, valuesByFieldId]);

  useEffect(() => {
    if (!measurement) return;
    if (fields.length === 0) return;
    initDraft();
  }, [fields.length, initDraft, measurement]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = fields.map((f) => {
        const raw = valuesDraft[f.id] ?? "";
        const num = raw.trim() === "" ? null : Number(raw);
        return { field_id: f.id, value: Number.isFinite(num) ? num : null };
      });

      return updateMeasurement(measurementId, {
        taken_by: takenByDraft && takenByDraft !== "__none__" ? Number(takenByDraft) : null,
        notes: notesDraft || null,
        values,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["measurements"] });
      toast({ title: "Saved", description: "Measurement updated." });
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Save failed", description: message || "Unable to update measurement.", variant: "destructive" });
    },
  });

  if (!Number.isFinite(measurementId)) {
    return <div className="p-8 text-center text-muted-foreground">Measurement not found</div>;
  }

  if (measurementQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading measurement...</div>;
  }

  if (!measurement) {
    return <div className="p-8 text-center text-muted-foreground">Measurement not found</div>;
  }

  const garmentTab = measurement.garment_type.toLowerCase();
  const showValues = isEditing ? valuesDraft : Object.fromEntries(valuesByFieldId.entries());

  const handleTabChange = (val: string) => {
    if (!measurement) return;
    if (val === garmentTab) return;
    const targetGarment = val.charAt(0).toUpperCase() + val.slice(1);
    
    const existing = allMeasurementsQuery.data?.data.find(
      m => m.customer_id === measurement.customer_id && m.garment_type.toLowerCase() === val
    );

    if (existing) {
      navigate(`/measurements/${existing.id}`);
    } else {
      navigate(`/measurements/new?customer_id=${measurement.customer_id}&garment_type=${encodeURIComponent(targetGarment)}`);
    }
  };

  return (
    <div>
      <PageHeader
        title={measurement.customer?.name ?? "Measurement"}
        subtitle={`${measurement.garment_type} · Updated ${measurement.updated_at}`}
        backTo="/measurements"
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

      <SectionCard title="Measurement Info" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EditableField label="Garment Type" value={measurement.garment_type} isEditing={false} onChange={() => {}} />
          <EditableField
            label="Taken By"
            value={isEditing ? takenByDraft : measurement.taker?.name ?? "—"}
            isEditing={isEditing}
            type="select"
            options={[
              { value: "__none__", label: "—" },
              ...(staffQuery.data ?? []).map((s) => ({ value: String(s.id), label: s.name })),
            ]}
            onChange={(v) => setTakenByDraft(v)}
          />
          <EditableField label="Customer Code" value={measurement.customer?.customer_code ?? ""} isEditing={false} onChange={() => {}} />
        </div>
      </SectionCard>

      <Tabs value={garmentTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="suit">Suit</TabsTrigger>
          <TabsTrigger value="shirt">Shirt</TabsTrigger>
          <TabsTrigger value="pants">Pants</TabsTrigger>
        </TabsList>

        {(["suit", "shirt", "pants"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {measurement.garment_type.toLowerCase() === tab && (
              <SectionCard title={`${measurement.garment_type} Measurements`}>
                <div className="flex justify-end mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = JSON.stringify(
                        fields.map((f) => ({ field: f.field_name, value: showValues[f.id] ?? "", unit: f.unit })),
                        null,
                        2,
                      );
                      void navigator.clipboard.writeText(text);
                      toast({ title: "Copied", description: "Measurements copied to clipboard." });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {fields.map((f) => (
                    <EditableField
                      key={f.id}
                      label={f.field_name}
                      value={showValues[f.id] ?? ""}
                      isEditing={isEditing}
                      unit={f.unit}
                      type="number"
                      onChange={(v) => setValuesDraft((prev) => ({ ...prev, [f.id]: v }))}
                    />
                  ))}
                </div>
              </SectionCard>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <SectionCard title="" className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm sm:text-base font-semibold">Measurement Notes & Special Instructions</h3>
        </div>
        <EditableField
          label=""
          value={isEditing ? notesDraft : measurement.notes ?? "No notes"}
          isEditing={isEditing}
          type="textarea"
          onChange={(v) => setNotesDraft(v)}
        />
      </SectionCard>
    </div>
  );
}
