import { useEffect, useMemo, useState, useRef } from "react";
import { format } from "date-fns";
import { Copy, Printer, FileImage, Loader2, MessageCircle } from "lucide-react";
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
import { listCustomers, getCustomer, uploadCustomerBodyImage } from "@/services/customers";
import { resolvePublicUrl } from "@/services/api";
import DatePicker from "@/components/DatePicker";
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
// These Body fields are hidden from the Body tab view (they appear within Suit/Shirt/Pants sections instead)
const BODY_HIDDEN_FIELDS = ["Chest", "Waist", "Hip", "Shoulder Width", "Arm Length", "Neck Size", "Wrist Size"];

const formatDateString = (str: string | null | undefined): string => {
  if (!str) return "";
  if (str.includes("T")) {
    return str.split("T")[0];
  }
  return str.substring(0, 10);
};

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

  const bodyImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedCustomerId = customerId ? Number(customerId) : NaN;

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

  const allFieldsQuery = useQuery({
    queryKey: ["measurement-fields-all"],
    queryFn: () => listMeasurementFields(),
  });

  const allFields = useMemo(() => allFieldsQuery.data ?? [], [allFieldsQuery.data]);

  const fieldsByGarment = useMemo(() => {
    const groups: Record<string, typeof allFields> = {
      Body: [],
      Suit: [],
      Shirt: [],
      Pants: [],
    };
    for (const f of allFields) {
      if (groups[f.garment_type]) {
        groups[f.garment_type].push(f);
      }
    }
    return groups;
  }, [allFields]);

  const buildMeasurementJson = () => {
    const json: Record<string, Record<string, string | null>> = {
      Body: {},
      Suit: {},
      Shirt: {},
      Pants: {},
    };
    for (const f of allFields) {
      const raw = valuesDraft[f.id] ?? "";
      const clean = raw.trim();
      if (!json[f.garment_type]) {
        json[f.garment_type] = {};
      }
      json[f.garment_type][f.field_name] = clean === "" ? null : clean;
    }
    return json;
  };

  const handleGarmentTypeChange = (v: string) => {
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
      if (measurement && measurement.customer_id === Number(customerId)) {
        return measurement;
      }
      return null;
    }
    return (
      rows.find((m) => m.customer_id === Number(customerId)) ?? null
    );
  }, [allMeasurementsQuery.data, customerId, isEditMode, measurement]);

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
    setTrialDate(formatDateString(currentGarmentMeasurement.trial_date));
    setDeliveryDate(formatDateString(currentGarmentMeasurement.delivery_date));
  }, [currentGarmentMeasurement, customerId, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!customerId) return;
    if (allFields.length === 0) return;
    if (!currentGarmentMeasurement) return;

    const next: Record<number, string> = {};
    const valuesByFieldId = new Map<number, string>();
    for (const v of currentGarmentMeasurement.values ?? []) {
      if (typeof v.field_id !== "number") continue;
      if (v.value === null || v.value === undefined) continue;
      valuesByFieldId.set(v.field_id, String(v.value));
    }

    for (const f of allFields) {
      const direct = valuesByFieldId.get(f.id);
      if (direct !== undefined) {
        next[f.id] = direct;
        continue;
      }
      const fromJson = currentGarmentMeasurement.measurement_json?.[f.garment_type]?.[f.field_name];
      next[f.id] = fromJson === null || fromJson === undefined ? "" : String(fromJson);
    }
    setValuesDraft(next);
  }, [currentGarmentMeasurement, customerId, allFields, isEditMode]);

  const createMutation = useMutation({
    mutationFn: createMeasurement,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["measurements"] });
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

    if (!trialDate) {
      toast({
        title: "Trial Date required",
        description: "Please select a trial date.",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryDate) {
      toast({
        title: "Delivery Date required",
        description: "Please select a delivery date.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      customer_id: Number(customerId),
      garment_type: garmentType,
      taken_by: takenBy !== "__none__" ? Number(takenBy) : null,
      notes: notes || null,
      trial_date: trialDate || null,
      delivery_date: deliveryDate || null,
      measurement_json: buildMeasurementJson(),
    });
  };

  const handlePrint = () => {
    // Generate the HTML report using live data (printSections)
    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Measurement Report</title>
<style>
body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #333; margin: 20px; }
table { width: 100%; border-collapse: collapse; }
.header { border-bottom: 3px solid #222; margin-bottom: 15px; pb-2; }
.header h1 { margin: 0; font-size: 26px; color: #1f3558; }
.info td { padding: 6px; }
.section { background: #1f3558; color: #fff; padding: 8px 12px; font-weight: bold; margin-top: 20px; text-transform: uppercase; }
.measure-table td { border: 1px solid #ddd; padding: 8px; }
.measure-table th { background: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; }
.value { width: 90px; text-align: center; font-weight: bold; }
.footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
</style>
</head>
<body>
<div class="header">
  <h1>BESPOKE TAILORING</h1>
  <div style="font-size:18px;font-weight:bold;margin-top:5px;color:#d97706;">
    Customer Measurement Report
  </div>
</div>
<table class="info">
  <tr>
    <td><b>Customer</b></td>
    <td>${measurement?.customer?.name || customerQuery.data?.name || "—"}</td>
    <td><b>Customer ID</b></td>
    <td>${measurement?.customer?.customer_code || customerQuery.data?.customer_code || "—"}</td>
  </tr>
</table>`;

    for (const section of printSections) {
      // Filter out empty rows to keep the print clean
      const filledRows = section.rows.filter(r => r.value && String(r.value).trim() !== "");
      if (filledRows.length === 0) continue;

      html += `<div class="section">${section.label}</div>`;
      html += `<table class="measure-table"><tr><th>Measurement</th><th class="value">Value</th><th>Measurement</th><th class="value">Value</th></tr>`;
      
      for (let i = 0; i < filledRows.length; i += 2) {
        const row1 = filledRows[i];
        const row2 = i + 1 < filledRows.length ? filledRows[i + 1] : null;
        
        const val1 = row1.value ? `${row1.value} ${row1.unit || ""}`.trim() : "-";
        const val2 = row2 && row2.value ? `${row2.value} ${row2.unit || ""}`.trim() : (row2 ? "-" : "");
        
        html += `<tr>`;
        html += `<td>${row1.name}</td><td class="value">${val1}</td>`;
        if (row2) {
          html += `<td>${row2.name}</td><td class="value">${val2}</td>`;
        } else {
          html += `<td></td><td></td>`;
        }
        html += `</tr>`;
      }
      html += `</table>`;
    }

    html += `
<div class="footer">
  Generated by Bespoke Tailoring<br>
  ${new Date().toLocaleString()}
</div>
</body>
</html>`;

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      // Wait for content to render, then print
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remove iframe after printing dialog is closed
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  // Build a helper that returns what sections to show, matching the screen exactly.
  // Body tab shows ALL garment groups (Body filtered + Suit + Shirt + Pants).
  // Other tabs show only their own section.
  const getVisibleSections = async () => {
    const valuesMap = new Map<number, string>();
    for (const v of measurement?.values ?? []) {
      if (typeof v.field_id !== "number") continue;
      if (v.value === null || v.value === undefined || v.value === "") continue;
      valuesMap.set(v.field_id, String(v.value));
    }

    const garmentGroupsToShow = garmentType === "Body" ? GARMENT_TYPES : [garmentType as GarmentType];

    const sections: { label: string; rows: { name: string; value: string; unit: string }[] }[] = [];

    for (const g of garmentGroupsToShow) {
      let fieldRows = await listMeasurementFields(g);
      if (g === "Body") {
        // Match screen: hide fields that appear in Suit/Shirt/Pants
        fieldRows = fieldRows.filter((f) => !BODY_HIDDEN_FIELDS.includes(f.field_name));
      }
      const rows = fieldRows.map((f) => {
        const jsonVal = measurement?.measurement_json?.[g]?.[f.field_name];
        const val = valuesMap.get(f.id) ?? (jsonVal ?? "");
        return { name: f.field_name, value: String(val ?? ""), unit: f.unit ?? "" };
      });
      const label = g === "Body" ? "Body Measurements" : `${g} Details`;
      sections.push({ label, rows });
    }
    return sections;
  };

  const handleCopy = async () => {
    if (!measurement) {
      toast({ title: "Failed", description: "Measurement data not ready.", variant: "destructive" });
      return;
    }
    try {
      const sections = await getVisibleSections();
      const lines: string[] = [];
      lines.push(`Customer: ${measurement.customer?.name ?? "—"} (${measurement.customer?.customer_code ?? "—"})`);
      if (trialDate) lines.push(`Trial Date: ${trialDate}`);
      if (deliveryDate) lines.push(`Delivery Date: ${deliveryDate}`);

      for (const sec of sections) {
        lines.push("");
        lines.push(`=== ${sec.label} ===`);
        // Show ALL rows — empty values become "-" (matches screen exactly)
        for (const r of sec.rows) {
          const val = r.value !== "" ? `${r.value}${r.unit ? " " + r.unit : ""}` : "-";
          lines.push(`${r.name}: ${val}`);
        }
      }

      await navigator.clipboard.writeText(lines.join("\n").trim());
      toast({ title: "Copied", description: "Measurements copied to clipboard." });
    } catch {
      toast({ title: "Failed", description: "Failed to copy measurements.", variant: "destructive" });
    }
  };

  const handleWhatsApp = async () => {
    if (!measurement) return;
    try {
      const sections = await getVisibleSections();
      const lines: string[] = [];
      lines.push(`*Measurement Card*`);
      lines.push(`Customer: ${measurement.customer?.name ?? "—"} (${measurement.customer?.customer_code ?? "—"})`);
      if (trialDate) lines.push(`Trial Date: ${trialDate}`);
      if (deliveryDate) lines.push(`Delivery Date: ${deliveryDate}`);

      for (const sec of sections) {
        // WhatsApp: only send fields that have values (keep message clean)
        const filled = sec.rows.filter((r) => r.value !== "");
        if (filled.length === 0) continue;
        lines.push("");
        lines.push(`*${sec.label}*`);
        for (const r of filled) {
          lines.push(`${r.name}: ${r.value}${r.unit ? " " + r.unit : ""}`.trim());
        }
      }

      const text = encodeURIComponent(lines.join("\n").trim());
      const rawPhone = measurement.customer?.phone || "";
      const phoneDigits = rawPhone.replace(/\D/g, ''); // strip non-digits
      window.open(`https://api.whatsapp.com/send?phone=${phoneDigits}&text=${text}`, "_blank");
    } catch {
      toast({ title: "Failed", description: "Could not open WhatsApp.", variant: "destructive" });
    }
  };

  const canEdit = !isEditMode || isEditing;
  const mergedMeasurementJson = useMemo(() => {
    return buildMeasurementJson();
  }, [allFields, valuesDraft]);

  // printSections mirrors the screen exactly: show ALL fields (empty ones show as "-").
  // Body tab shows all groups; other tabs show only their group.
  const printSections = useMemo(() => {
    const garmentGroupsToShow = garmentType === "Body" ? GARMENT_TYPES : [garmentType as GarmentType];
    return garmentGroupsToShow.map((g) => {
      let currentFields = fieldsByGarment[g] ?? [];
      if (g === "Body") {
        currentFields = currentFields.filter((f) => !BODY_HIDDEN_FIELDS.includes(f.field_name));
      }
      const garmentValues = mergedMeasurementJson[g] ?? {};
      const label = g === "Body" ? "Body Measurements" : `${g} Details`;
      // Show ALL fields (match screen — empty values show as "-")
      const entries = currentFields.map(
        (f) => [f.field_name, garmentValues[f.field_name] ?? ""] as [string, string]
      );
      return { type: g, label, entries };
    });
  }, [mergedMeasurementJson, garmentType, fieldsByGarment]);

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
              setTrialDate(formatDateString(currentGarmentMeasurement.trial_date));
              setDeliveryDate(formatDateString(currentGarmentMeasurement.delivery_date));
              const next: Record<number, string> = {};
              const valuesByFieldId = new Map<number, string>();
              for (const v of currentGarmentMeasurement.values ?? []) {
                if (typeof v.field_id !== "number") continue;
                if (v.value === null || v.value === undefined) continue;
                valuesByFieldId.set(v.field_id, String(v.value));
              }
              for (const f of allFields) {
                const direct = valuesByFieldId.get(f.id);
                if (direct !== undefined) {
                  next[f.id] = direct;
                  continue;
                }
                const fromJson = currentGarmentMeasurement?.measurement_json?.[f.garment_type]?.[f.field_name];
                next[f.id] = fromJson === null || fromJson === undefined ? "" : String(fromJson);
              }
              setValuesDraft(next);
              setIsEditing(false);
            }}
            onSave={() => {
              if (!trialDate) {
                toast({
                  title: "Trial Date required",
                  description: "Please select a trial date.",
                  variant: "destructive",
                });
                return;
              }
              if (!deliveryDate) {
                toast({
                  title: "Delivery Date required",
                  description: "Please select a delivery date.",
                  variant: "destructive",
                });
                return;
              }

              const payload = {
                customer_id: Number(customerId),
                garment_type: garmentType,
                taken_by: takenBy !== "__none__" ? Number(takenBy) : null,
                notes: notes || null,
                trial_date: trialDate || null,
                delivery_date: deliveryDate || null,
                measurement_json: buildMeasurementJson(),
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
                    Trial Date *
                  </label>
                  <DatePicker
                    value={trialDate}
                    onChange={setTrialDate}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Delivery Date *
                  </label>
                  <DatePicker
                    value={deliveryDate}
                    onChange={setDeliveryDate}
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
          title={isEditMode ? "Fields" : ""}
          className="mb-6"
          headerActions={
            isEditMode ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 px-2 gap-1 text-xs"
                  title="Print measurement"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsApp}
                  className="h-8 px-2 gap-1 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2 gap-1 text-xs"
                  title="Copy all measurements"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            ) : null
          }
        >
          {isEditMode && (
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
          )}
          {allFieldsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading fields...</div>
          ) : allFields.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No fields configured
            </div>
          ) : (
            <div className="space-y-6">
              {garmentType === "Body" ? (
                !isEditMode ? (() => {
                  const uniqueFieldsMap = new Map<string, typeof allFields[0]>();
                  const matchingIdsMap = new Map<string, number[]>();
                  for (const f of allFields) {
                    if (!uniqueFieldsMap.has(f.field_name)) {
                      uniqueFieldsMap.set(f.field_name, f);
                    }
                    if (!matchingIdsMap.has(f.field_name)) {
                      matchingIdsMap.set(f.field_name, []);
                    }
                    matchingIdsMap.get(f.field_name)!.push(f.id);
                  }
                  
                  const uniqueFields = Array.from(uniqueFieldsMap.values());
                  
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {uniqueFields.map((f) => (
                        <div key={f.id} className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {f.field_name}
                          </div>
                          <Input
                            type="number"
                            value={valuesDraft[f.id] ?? ""}
                            onChange={(e) =>
                              setValuesDraft((prev) => {
                                const next = { ...prev };
                                const idsToUpdate = matchingIdsMap.get(f.field_name) ?? [f.id];
                                for (const id of idsToUpdate) {
                                  next[id] = e.target.value;
                                }
                                return next;
                              })
                            }
                            placeholder={f.unit}
                            disabled={!canEdit}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })() : (
                  (Object.keys(fieldsByGarment) as GarmentType[]).map((g) => {
                    let grpFields = fieldsByGarment[g] ?? [];
                    if (g === "Body") {
                      const hiddenFields = ["Chest", "Waist", "Hip", "Shoulder Width", "Arm Length", "Neck Size", "Wrist Size"];
                      grpFields = grpFields.filter((f) => !hiddenFields.includes(f.field_name));
                    }
                    if (grpFields.length === 0) return null;
                    return (
                      <div key={g} className="space-y-3">
                        <h3 className="text-sm font-semibold border-b border-border pb-1 text-primary">
                          {g === "Body" ? "Body Measurements" : `${g} Details`}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {grpFields.map((f) => (
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
                      </div>
                    );
                  })
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(fieldsByGarment[garmentType as GarmentType] ?? []).map((f) => (
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
            </div>
          )}
        </SectionCard>

        <SectionCard title="Add Images Section (Client Selfy Pics)" className="mb-6">
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
              <h2>{section.label ?? section.type}</h2>
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
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
