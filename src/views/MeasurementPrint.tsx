import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMeasurement, listMeasurementFields } from "@/services/measurements";
import { format } from "date-fns";

const GARMENT_TYPES = ["Body", "Suit", "Shirt", "Pants"];
const BODY_HIDDEN_FIELDS = ["Age", "Weight", "Fit", "Posture", "Shoulder Type"];

export default function MeasurementPrint() {
  const { id } = useParams();
  const measurementId = Number(id);

  const measurementQuery = useQuery({
    queryKey: ["measurements", "detail", measurementId],
    queryFn: () => getMeasurement(measurementId),
    enabled: Number.isFinite(measurementId),
  });

  const allFieldsQuery = useQuery({
    queryKey: ["measurement-fields-all"],
    queryFn: () => listMeasurementFields(),
  });

  const allFields = useMemo(() => allFieldsQuery.data ?? [], [allFieldsQuery.data]);

  const sections = useMemo(() => {
    if (!measurementQuery.data || allFields.length === 0) return [];
    
    const measurement = measurementQuery.data;
    const valuesMap = new Map<number, string>();
    for (const v of measurement.values ?? []) {
      valuesMap.set(v.field_id, v.field_value);
    }

    const groups: Record<string, typeof allFields> = {
      Body: [], Suit: [], Shirt: [], Pants: [],
    };
    for (const f of allFields) {
      if (groups[f.garment_type]) {
        groups[f.garment_type].push(f);
      }
    }

    const result = [];
    for (const g of GARMENT_TYPES) {
      let currentFields = groups[g] ?? [];
      if (g === "Body") {
        currentFields = currentFields.filter((f) => !BODY_HIDDEN_FIELDS.includes(f.field_name));
      }
      
      const rows = currentFields.map((f) => {
        let val = valuesMap.get(f.id) ?? "";
        return { name: f.field_name, value: val, unit: f.unit };
      });

      // Only keep fields that have a value
      const filledRows = rows.filter((r) => r.value && r.value.trim() !== "");
      if (filledRows.length > 0) {
        result.push({
          label: g === "Body" ? "Body Details" : `${g} Details`,
          rows: filledRows,
        });
      }
    }
    return result;
  }, [measurementQuery.data, allFields]);

  const measurement = measurementQuery.data;
  
  // Trigger print dialog once data is fully loaded and rendered
  useEffect(() => {
    if (measurementQuery.isSuccess && allFieldsQuery.isSuccess) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [measurementQuery.isSuccess, allFieldsQuery.isSuccess]);

  if (measurementQuery.isLoading || allFieldsQuery.isLoading) {
    return <div className="p-8 text-center">Loading Report...</div>;
  }

  if (!measurement) {
    return <div className="p-8 text-center text-destructive">Measurement not found.</div>;
  }

  return (
    <div className="bg-white min-h-screen print:bg-white">
      <div className="max-w-4xl mx-auto p-8 bg-white print:p-0 print:max-w-full">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex gap-6 items-center">
            {/* Mock Logo block (like reference image) */}
            <div className="bg-slate-900 text-white p-4 rounded text-center min-w-[120px]">
              <div className="text-amber-500 font-serif text-xl font-bold tracking-widest">BESPOKE</div>
              <div className="text-[10px] tracking-widest uppercase border-t border-amber-500/30 mt-1 pt-1 text-slate-300">Tailoring</div>
            </div>
            
            <div>
              <h1 className="text-3xl font-serif text-slate-900 font-bold mb-2 uppercase tracking-wide">Measurement Report</h1>
              <div className="flex gap-8 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">Order ID:</span> {measurement.order_id ? `ORD-${String(measurement.order_id).padStart(3, '0')}` : "—"}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Date:</span> {format(new Date(measurement.created_at || new Date()), "dd MMM yyyy")}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-lg p-4 min-w-[250px] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-amber-500 flex items-center justify-center shrink-0">
              <span className="text-amber-500 text-lg">👤</span>
            </div>
            <div>
              <div className="text-xs text-amber-500 font-medium uppercase tracking-wider mb-1">Customer</div>
              <div className="font-bold text-lg leading-tight">{measurement.customer?.name}</div>
              <div className="text-xs text-slate-300 mt-0.5">({measurement.customer?.customer_code || `C${String(measurement.customer_id).padStart(3, "0")}`})</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.label} className="border rounded-lg overflow-hidden border-slate-200">
              <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-amber-500 text-sm">📏</span>
                </div>
                <h3 className="font-bold tracking-widest uppercase text-sm">{section.label}</h3>
              </div>
              <div className="p-4 bg-slate-50/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                  {section.rows.map((row) => (
                    <div key={row.name} className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                      <span className="text-sm font-medium text-slate-600">{row.name}</span>
                      <span className="text-sm font-bold text-slate-900">
                        {row.value} <span className="text-xs font-normal text-slate-500">{row.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {sections.length === 0 && (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg">
              No measurements found for this record.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 flex justify-between items-end">
          <div className="flex gap-3">
            <div className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded text-slate-400">
              📝
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Notes:</div>
              <div className="text-xs text-slate-500 mt-1">
                {measurement.notes || "All measurements are in inches. Please review and confirm for accuracy."}
              </div>
            </div>
          </div>
          
          <div className="text-center w-48">
            <div className="border-b border-slate-900 pb-2 mb-2 h-12">
              {/* Signature space */}
            </div>
            <div className="text-xs text-slate-600 font-medium uppercase tracking-wider">Authorized By</div>
          </div>
        </div>

      </div>
    </div>
  );
}
