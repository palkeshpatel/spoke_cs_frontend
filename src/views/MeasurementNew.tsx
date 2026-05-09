import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Copy, Printer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelectWithAdd from "@/components/CustomerSelectWithAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { listCustomers } from "@/services/customers";
import {
  createMeasurement,
  getMeasurement,
  listMeasurementFields,
  listMeasurements,
  updateMeasurement,
} from "@/services/measurements";

type GarmentType = "Body" | "Suit" | "Shirt" | "Pants";
type GarmentDraft = {
  takenBy: string;
  notes: string;
  trialDate: string;
  deliveryDate: string;
  valuesDraft: Record<number, string>;
  measurementJson: Record<string, string | null>;
};
const GARMENT_TYPES: GarmentType[] = ["Body", "Suit", "Shirt", "Pants"];

export default function MeasurementNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const measurementId = params.id ? Number(params.id) : null;
  const isEditMode = measurementId !== null && Number.isFinite(measurementId);

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [garmentType, setGarmentType] = useState<string>("Body");
  const [takenBy, setTakenBy] = useState<string>("__none__");
  const [notes, setNotes] = useState<string>("");
  const [trialDate, setTrialDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [valuesDraft, setValuesDraft] = useState<Record<number, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftByGarment, setDraftByGarment] = useState<
    Partial<Record<GarmentType, GarmentDraft>>
  >({});

  const buildCurrentGarmentObject = () => {
    const garmentObj: Record<string, string | null> = {};
    for (const f of fields) {
      const raw = valuesDraft[f.id] ?? "";
      const clean = raw.trim();
      garmentObj[f.field_name] = clean === "" ? null : clean;
    }
    return garmentObj;
  };

  useEffect(() => {
    if (isEditMode) return;
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    const gt = params.get("garment_type");
    if (cid) setCustomerId(cid);
    if (gt === "Body" || gt === "Suit" || gt === "Shirt" || gt === "Pants") {
      setGarmentType(gt);
      setValuesDraft({});
    }
  }, [isEditMode, location.search]);

  // Customers query — shared cache key with CustomerSelectWithAdd, no duplicate API call
  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
    staleTime: 30_000,
  });

  const allMeasurementsQuery = useQuery({
    queryKey: ["measurements", "list"],
    queryFn: () => listMeasurements(200),
    enabled: !!customerId,
  });

  const fieldsQuery = useQuery({
    queryKey: ["measurement-fields", garmentType],
    queryFn: () => listMeasurementFields(garmentType),
  });

  const fields = useMemo(() => fieldsQuery.data ?? [], [fieldsQuery.data]);

  const handleGarmentTypeChange = (v: string) => {
    const currentKey = garmentType as GarmentType;
    setDraftByGarment((prev) => ({
      ...prev,
      [currentKey]: {
        takenBy,
        notes,
        trialDate,
        deliveryDate,
        valuesDraft: { ...valuesDraft },
        measurementJson: buildCurrentGarmentObject(),
      },
    }));
    setGarmentType(v);
  };

  const measurementQuery = useQuery({
    queryKey: ["measurements", "detail", measurementId],
    queryFn: () => getMeasurement(measurementId as number),
    enabled: isEditMode,
  });

  const measurement = measurementQuery.data;
  const currentGarmentMeasurement = useMemo(() => {
    if (!isEditMode) return null;
    if (!customerId) return measurement ?? null;
    const rows = allMeasurementsQuery.data?.data;
    if (!rows) {
      if (
        measurement &&
        measurement.customer_id === Number(customerId) &&
        measurement.garment_type.toLowerCase() === garmentType.toLowerCase()
      ) {
        return measurement;
      }
      return null;
    }
    return (
      rows.find(
        (m) =>
          m.customer_id === Number(customerId) &&
          m.garment_type.toLowerCase() === garmentType.toLowerCase(),
      ) ?? null
    );
  }, [allMeasurementsQuery.data, customerId, garmentType, isEditMode, measurement]);

  useEffect(() => {
    if (!isEditMode) {
      setIsEditing(true);
      return;
    }
    if (!measurement) return;
    setCustomerId(String(measurement.customer_id));
    setGarmentType("Body");
  }, [isEditMode, measurement]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!customerId) return;
    const draft = draftByGarment[garmentType as GarmentType];
    if (draft) {
      setTakenBy(draft.takenBy);
      setNotes(draft.notes);
      setTrialDate(draft.trialDate);
      setDeliveryDate(draft.deliveryDate);
      setValuesDraft(draft.valuesDraft);
      return;
    }

    if (!currentGarmentMeasurement) {
      setTakenBy("__none__");
      setNotes("");
      setTrialDate("");
      setDeliveryDate("");
      setValuesDraft({});
      return;
    }

    setTakenBy(
      currentGarmentMeasurement.taken_by
        ? String(currentGarmentMeasurement.taken_by)
        : "__none__",
    );
    setNotes(currentGarmentMeasurement.notes ?? "");
    setTrialDate(currentGarmentMeasurement.trial_date ?? "");
    setDeliveryDate(currentGarmentMeasurement.delivery_date ?? "");
  }, [
    currentGarmentMeasurement,
    customerId,
    draftByGarment,
    garmentType,
    isEditMode,
  ]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!customerId) return;
    if (draftByGarment[garmentType as GarmentType]) return;
    if (fields.length === 0) return;
    const next: Record<number, string> = {};
    const valuesByFieldId = new Map<number, string>();
    for (const v of currentGarmentMeasurement?.values ?? []) {
      if (typeof v.field_id !== "number") continue;
      if (v.value === null || v.value === undefined) continue;
      valuesByFieldId.set(v.field_id, String(v.value));
    }
    for (const f of fields) {
      const direct = valuesByFieldId.get(f.id);
      if (direct !== undefined) {
        next[f.id] = direct;
        continue;
      }
      const fromJson =
        currentGarmentMeasurement?.measurement_json?.[garmentType]?.[f.field_name];
      next[f.id] =
        fromJson === null || fromJson === undefined ? "" : String(fromJson);
    }
    setValuesDraft(next);
  }, [
    currentGarmentMeasurement,
    customerId,
    draftByGarment,
    fields,
    garmentType,
    isEditMode,
  ]);

  const createMutation = useMutation({
    mutationFn: createMeasurement,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["measurements"] });
      setDraftByGarment({});
      toast({
        title: "Measurement created",
        description: `Measurement #${created.id} created.`,
      });
      navigate(`/measurements/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      toast({
        title: "Create failed",
        description: message || "Unable to create measurement.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Parameters<typeof updateMeasurement>[1] }) =>
      updateMeasurement(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["measurements"] });
      await queryClient.invalidateQueries({
        queryKey: ["measurements", "detail", measurementId],
      });
      setDraftByGarment((prev) => {
        const next = { ...prev };
        delete next[garmentType as GarmentType];
        return next;
      });
      toast({ title: "Saved", description: "Measurement updated." });
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      toast({
        title: "Save failed",
        description: message || "Unable to update measurement.",
        variant: "destructive",
      });
    },
  });

  const submit = () => {
    if (!customerId) {
      toast({
        title: "Customer required",
        description: "Please select customer.",
        variant: "destructive",
      });
      return;
    }

    const mergedJson: Record<string, Record<string, string | null>> = {};
    for (const [g, draft] of Object.entries(draftByGarment) as [GarmentType, GarmentDraft][]) {
      mergedJson[g] = draft.measurementJson;
    }
    mergedJson[garmentType] = buildCurrentGarmentObject();

    createMutation.mutate({
      customer_id: Number(customerId),
      garment_type: garmentType,
      taken_by: takenBy !== "__none__" ? Number(takenBy) : null,
      notes: notes || null,
      trial_date: trialDate || null,
      delivery_date: deliveryDate || null,
      measurement_json: mergedJson,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    if (!customerId || !measurement) {
      toast({
        title: "Failed",
        description: "Measurement data not ready for copy.",
        variant: "destructive",
      });
      return;
    }

    const preferredOrder = ["Body", "Suit", "Shirt", "Pants"] as const;
    const rows = allMeasurementsQuery.data?.data ?? [];
    const customerMeasurements = rows.filter((m) => m.customer_id === Number(customerId));
    const byGarment = new Map(customerMeasurements.map((m) => [m.garment_type.toLowerCase(), m]));
    if (!byGarment.has(measurement.garment_type.toLowerCase())) {
      byGarment.set(measurement.garment_type.toLowerCase(), measurement);
    }

    try {
      const fieldsByGarmentEntries = await Promise.all(
        preferredOrder.map(async (g) => {
          const fieldRows = await listMeasurementFields(g);
          return [g.toLowerCase(), fieldRows] as const;
        }),
      );
      const fieldsByGarment = new Map(fieldsByGarmentEntries);

      const sections: string[] = [];
      sections.push(`Customer: ${measurement.customer?.name ?? "—"} (${measurement.customer?.customer_code ?? "—"})`);
      sections.push(`Copied On: ${format(new Date(), "dd-MMM-yyyy hh:mm a")}`);
      sections.push("");

      for (const garment of preferredOrder) {
        const record = byGarment.get(garment.toLowerCase());
        sections.push(`=== ${garment} ===`);
        if (!record) {
          sections.push("No measurement available.");
          sections.push("");
          continue;
        }

        const fieldRows = fieldsByGarment.get(garment.toLowerCase()) ?? [];
        const valuesMap = new Map<number, string>();
        for (const valueRow of record.values ?? []) {
          if (typeof valueRow.field_id !== "number") continue;
          if (valueRow.value === null || valueRow.value === undefined || valueRow.value === "") continue;
          valuesMap.set(valueRow.field_id, String(valueRow.value));
        }

        if (fieldRows.length === 0) {
          sections.push("No fields configured.");
        } else {
          for (const fieldRow of fieldRows) {
            const jsonVal =
              record.measurement_json?.[garment]?.[fieldRow.field_name];
            const val = valuesMap.get(fieldRow.id) ?? (jsonVal ?? "-");
            const unit = fieldRow.unit ? ` ${fieldRow.unit}` : "";
            sections.push(`${fieldRow.field_name}: ${val}${unit}`);
          }
        }

        sections.push(`Taken By: ${record.taker?.name ?? "—"}`);
        sections.push(`Trial Date: ${record.trial_date ?? "-"}`);
        sections.push(`Delivery Date: ${record.delivery_date ?? "-"}`);
        sections.push(`Notes: ${record.notes?.trim() ? record.notes : "-"}`);
        sections.push("");
      }

      await navigator.clipboard.writeText(sections.join("\n").trim());
      toast({ title: "Copied", description: "All garment measurements copied." });
    } catch {
      toast({
        title: "Failed",
        description: "Failed to copy all garment measurements.",
        variant: "destructive",
      });
    }
  };

  const canEdit = !isEditMode || isEditing;
  const mergedMeasurementJson = useMemo(() => {
    const baseJson =
      measurement?.measurement_json && typeof measurement.measurement_json === "object"
        ? (measurement.measurement_json as Record<string, Record<string, string | null>>)
        : {};
    const mergedJson: Record<string, Record<string, string | null>> = { ...baseJson };
    for (const [g, draft] of Object.entries(draftByGarment) as [GarmentType, GarmentDraft][]) {
      mergedJson[g] = draft.measurementJson;
    }
    if (isEditMode) {
      mergedJson[garmentType] = buildCurrentGarmentObject();
    }
    return mergedJson;
  }, [draftByGarment, garmentType, isEditMode, measurement?.measurement_json, fields, valuesDraft]);

  const printSections = useMemo(
    () =>
      GARMENT_TYPES.map((type) => {
        const garmentValues = mergedMeasurementJson[type] ?? {};
        const entries = Object.entries(garmentValues).sort(([a], [b]) =>
          a.localeCompare(b),
        );
        return { type, entries };
      }),
    [mergedMeasurementJson],
  );

  if (isEditMode && measurementQuery.isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading measurement...
      </div>
    );
  }

  if (isEditMode && !measurement) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Measurement not found
      </div>
    );
  }

  return (
    <div className="measurement-print-root">
      <div className="screen-only-measurement">
        {isEditMode ? (
          <PageHeader
            title={measurement?.customer?.name ?? "Measurement"}
            subtitle={`${garmentType} · Updated ${measurement?.updated_at ? format(new Date(measurement.updated_at), "dd-MMM-yyyy") : ""}`}
            backTo="/measurements"
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            persistActions
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                title="Print measurement"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            }
            onCancel={() => {
              setDraftByGarment({});
              if (!currentGarmentMeasurement) {
                setTakenBy("__none__");
                setNotes("");
                setTrialDate("");
                setDeliveryDate("");
                setValuesDraft({});
                setIsEditing(false);
                return;
              }
              setTakenBy(
                currentGarmentMeasurement.taken_by
                  ? String(currentGarmentMeasurement.taken_by)
                  : "__none__",
              );
              setNotes(currentGarmentMeasurement.notes ?? "");
              setTrialDate(currentGarmentMeasurement.trial_date ?? "");
              setDeliveryDate(currentGarmentMeasurement.delivery_date ?? "");
              const next: Record<number, string> = {};
              const valuesByFieldId = new Map<number, string>();
              for (const v of currentGarmentMeasurement.values ?? []) {
                if (typeof v.field_id !== "number") continue;
                if (v.value === null || v.value === undefined) continue;
                valuesByFieldId.set(v.field_id, String(v.value));
              }
              for (const f of fields) {
                const direct = valuesByFieldId.get(f.id);
                if (direct !== undefined) {
                  next[f.id] = direct;
                  continue;
                }
                const fromJson =
                  currentGarmentMeasurement?.measurement_json?.[garmentType]?.[
                    f.field_name
                  ];
                next[f.id] =
                  fromJson === null || fromJson === undefined
                    ? ""
                    : String(fromJson);
              }
              setValuesDraft(next);
              setIsEditing(false);
            }}
            onSave={() => {
              const baseJson =
                measurement?.measurement_json && typeof measurement.measurement_json === "object"
                  ? { ...measurement.measurement_json }
                  : {};
              const mergedJson: Record<string, Record<string, string | null>> = {
                ...baseJson,
              };
              for (const [g, draft] of Object.entries(draftByGarment) as [GarmentType, GarmentDraft][]) {
                mergedJson[g] = draft.measurementJson;
              }
              mergedJson[garmentType] = buildCurrentGarmentObject();

              const payload = {
                customer_id: Number(customerId),
                garment_type: garmentType,
                taken_by: takenBy !== "__none__" ? Number(takenBy) : null,
                notes: notes || null,
                trial_date: trialDate || null,
                delivery_date: deliveryDate || null,
                measurement_json: mergedJson,
              };

              if (!currentGarmentMeasurement) {
                createMutation.mutate(payload);
                return;
              }
              updateMutation.mutate({
                id: currentGarmentMeasurement.id,
                payload: {
                  garment_type: garmentType,
                  taken_by: payload.taken_by,
                  notes: payload.notes,
                  trial_date: payload.trial_date,
                  delivery_date: payload.delivery_date,
                  measurement_json: payload.measurement_json,
                },
              });
            }}
          />
        ) : (
          <PageHeader
            title="New Measurement"
            subtitle="Create customer measurement record"
            backTo="/measurements"
          />
        )}

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <SectionCard title="Measurement Details">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Customer *
                </label>
                {isEditMode ? (
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm">
                    {measurement?.customer
                      ? `${measurement.customer.name} (${measurement.customer.customer_code})`
                      : "—"}
                  </div>
                ) : (
                  <CustomerSelectWithAdd
                    value={customerId}
                    onChange={setCustomerId}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Trial Date
                  </label>
                  <Input
                    type="date"
                    value={trialDate}
                    onChange={(e) => setTrialDate(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Delivery Date
                  </label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 p-2"
                title="Copy CSV"
              >
                <Copy className="h-4 w-4" />
              </Button>
            ) : null
          }
        >
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-2 block">
              Garment Type *
            </label>
            <Tabs value={garmentType} onValueChange={handleGarmentTypeChange}>
              <TabsList className="w-full">
                <TabsTrigger value="Body" className="flex-1">
                  Body
                </TabsTrigger>
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
            <div className="text-sm text-muted-foreground">
              No fields configured for {garmentType}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {fields.map((f) => (
                <div key={f.id} className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {f.field_name}
                  </div>
                  <Input
                    type="number"
                    value={valuesDraft[f.id] ?? ""}
                    onChange={(e) =>
                      setValuesDraft((prev) => ({
                        ...prev,
                        [f.id]: e.target.value,
                      }))
                    }
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

      {isEditMode ? (
        <div className="print-only-measurement">
          <div className="print-measurement-header">
            <h1>{measurement?.customer?.name ?? "Measurement"}</h1>
            <p>Customer Code: {measurement?.customer?.customer_code ?? "-"}</p>
            <p>Trial Date: {trialDate || "-"}</p>
            <p>Delivery Date: {deliveryDate || "-"}</p>
            <p>Notes: {notes?.trim() ? notes : "-"}</p>
          </div>
          {printSections.map((section) => (
            <section key={section.type} className="print-garment-block">
              <h2>{section.type}</h2>
              {section.entries.length === 0 ? (
                <p>No measurement values.</p>
              ) : (
                <table>
                  <tbody>
                    {section.entries.map(([fieldName, value]) => (
                      <tr key={`${section.type}-${fieldName}`}>
                        <th>{fieldName}</th>
                        <td>{value === null || value === "" ? "-" : String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
