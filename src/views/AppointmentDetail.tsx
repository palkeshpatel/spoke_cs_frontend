import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getAppointment, updateAppointment } from "@/services/appointments";

type AppointmentForm = {
  customerName: string;
  customerCode: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  priority: "low" | "normal" | "high";
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export default function AppointmentDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<AppointmentForm | null>(null);

  const appointmentId = id ? Number(id) : NaN;

  const appointmentQuery = useQuery({
    queryKey: ["appointments", "detail", appointmentId],
    queryFn: () => getAppointment(appointmentId),
    enabled: Number.isFinite(appointmentId),
  });

  const appointment = appointmentQuery.data;

  const initialForm = useMemo(() => {
    if (!appointment) return null;
    return {
      customerName: appointment.customer?.name ?? "—",
      customerCode: appointment.customer?.customer_code ?? `C${String(appointment.customer_id).padStart(3, "0")}`,
      serviceType: appointment.service_type,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : "",
      durationMinutes: String(appointment.duration_minutes ?? 0),
      status: appointment.status,
      priority: appointment.priority,
      notes: appointment.notes ?? "",
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at,
    };
  }, [appointment]);

  useEffect(() => {
    if (!initialForm) return;
    setForm(initialForm);
  }, [initialForm]);

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateAppointment>[1]) => updateAppointment(appointmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Saved", description: "Appointment updated." });
      setIsEditing(false);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Save failed", description: message || "Unable to update appointment.", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => updateAppointment(appointmentId, { status: "completed" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Completed", description: "Appointment marked completed." });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Update failed", description: message || "Unable to update appointment.", variant: "destructive" });
    },
  });

  if (!Number.isFinite(appointmentId)) {
    return <div className="p-8 text-center text-muted-foreground">Appointment not found</div>;
  }

  if (appointmentQuery.isLoading || !form) {
    return <div className="p-8 text-center text-muted-foreground">Loading appointment...</div>;
  }

  if (appointmentQuery.isError || !appointment) {
    return <div className="p-8 text-center text-muted-foreground">Appointment not found</div>;
  }

  const updateForm = <K extends keyof AppointmentForm>(key: K, val: AppointmentForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: val } : f));

  return (
    <div>
      <PageHeader
        title="Appointment Details"
        subtitle={`ID: ${id}`}
        backTo="/appointments"
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={() => {
          saveMutation.mutate({
            service_type: form.serviceType,
            appointment_date: form.appointmentDate,
            appointment_time: form.appointmentTime ? `${form.appointmentTime}:00` : null,
            duration_minutes: Number(form.durationMinutes || 0),
            status: form.status,
            priority: form.priority,
            notes: form.notes || null,
          });
        }}
        onCancel={() => {
          if (initialForm) setForm(initialForm);
          setIsEditing(false);
        }}
        actions={
          <Button size="sm" variant="complete" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
            <CheckCircle className="h-4 w-4 mr-1" /> Complete
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">{form.customerName}</h2>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{form.customerCode}</span>
                <StatusBadge status={form.status} />
              </div>
              <p className="text-sm text-primary mt-0.5">{form.serviceType}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-4">
            <EditableField label="Date" value={form.appointmentDate} isEditing={isEditing} type="date" onChange={(v) => updateForm("appointmentDate", v)} />
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Time"
                value={form.appointmentTime || "—"}
                isEditing={isEditing}
                onChange={(v) => updateForm("appointmentTime", v)}
              />
              <EditableField
                label="Duration"
                value={form.durationMinutes}
                isEditing={isEditing}
                type="number"
                onChange={(v) => updateForm("durationMinutes", v)}
                unit="min"
              />
            </div>
          </div>
          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Priority Level</span>
            {isEditing ? (
              <EditableField
                label=""
                value={form.priority}
                isEditing={isEditing}
                type="select"
                options={[
                  { value: "high", label: "HIGH" },
                  { value: "normal", label: "NORMAL" },
                  { value: "low", label: "LOW" },
                ]}
                onChange={(v) => updateForm("priority", v as AppointmentForm["priority"])}
              />
            ) : (
              <PriorityBadge priority={form.priority === "high" ? "HIGH" : form.priority === "low" ? "LOW" : "NORMAL"} />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Appointment Information">
          <div className="space-y-4">
            <EditableField label="Service" value={form.serviceType} isEditing={isEditing} onChange={(v) => updateForm("serviceType", v)} />
            {isEditing ? (
              <EditableField
                label="Status"
                value={form.status}
                isEditing={isEditing}
                type="select"
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                onChange={(v) => updateForm("status", v as AppointmentForm["status"])}
              />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={form.status} />
              </div>
            )}
          </div>
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm flex-wrap gap-1">
              <span className="text-muted-foreground">Created</span>
              <span>{form.createdAt ? format(new Date(form.createdAt), "dd-MMM-yyyy") : "—"}</span>
            </div>
            <div className="flex justify-between text-sm flex-wrap gap-1">
              <span className="text-muted-foreground">Updated</span>
              <span>{form.updatedAt ? format(new Date(form.updatedAt), "dd-MMM-yyyy") : "—"}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm sm:text-base font-semibold">Appointment Notes</h3>
        </div>
        {isEditing ? (
          <EditableField label="" value={form.notes} isEditing={true} type="textarea" onChange={(v) => updateForm("notes", v)} />
        ) : (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm">{form.notes || "—"}</p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
