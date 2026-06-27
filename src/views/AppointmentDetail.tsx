import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import EditableField from "@/components/EditableField";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Bell, CalendarClock, CheckCircle, MessageSquare, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getAppointment, sendAppointmentReminder, updateAppointment, listAppointmentServices } from "@/services/appointments";

function toDateInputValue(v: string | null | undefined): string {
  if (!v) return "";
  if (v.includes("T")) return v.split("T")[0] ?? "";
  return v.length >= 10 ? v.slice(0, 10) : v;
}

type AppointmentForm = {
  customerName: string;
  customerCode: string;
  customerEmail: string;
  customerPhone: string;
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

  const servicesQuery = useQuery({
    queryKey: ["appointment-services", "list"],
    queryFn: () => listAppointmentServices(),
  });

  const serviceOptions = (servicesQuery.data ?? []).map((s) => ({ value: s.service_name, label: s.service_name }));

  const appointment = appointmentQuery.data;

  const initialForm = useMemo(() => {
    if (!appointment) return null;
    return {
      customerName: appointment.customer?.name ?? "—",
      customerCode: appointment.customer?.customer_code ?? `C${String(appointment.customer_id).padStart(3, "0")}`,
      customerEmail: appointment.customer?.email ?? "",
      customerPhone: appointment.customer?.phone ?? "",
      serviceType: appointment.service_type,
      appointmentDate: toDateInputValue(appointment.appointment_date),
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

  const reminderMutation = useMutation({
    mutationFn: () => sendAppointmentReminder(appointmentId),
    onSuccess: () => {
      toast({ title: "Reminder sent", description: "Email reminder sent to customer (if email is available)." });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Reminder failed", description: message || "Unable to send reminder.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => updateAppointment(appointmentId, { status: "cancelled" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments", "detail", appointmentId] });
      toast({ title: "Cancelled", description: "Appointment cancelled." });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Cancel failed", description: message || "Unable to cancel appointment.", variant: "destructive" });
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

  const isCancelled = form.status === "cancelled";
  const isCompleted = form.status === "completed";
  const canRemind = !isCancelled;
  const canReschedule = !isCancelled && !isCompleted;
  const canCancel = !isCancelled;

  return (
    <div className="pb-24">
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
              {form.customerPhone || form.customerEmail ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {form.customerPhone ? form.customerPhone : null}
                  {form.customerPhone && form.customerEmail ? " · " : null}
                  {form.customerEmail ? form.customerEmail : null}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">—</p>
              )}
              <p className="text-sm text-primary font-medium bg-gradient-to-r from-primary/10 to-accent/10 px-2 py-1 rounded-md inline-block">{form.serviceType}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4 mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <EditableField 
                label="Date *" 
                value={form.appointmentDate} 
                isEditing={isEditing} 
                type="date" 
                onChange={(v) => updateForm("appointmentDate", v)} 
              />
              <EditableField
                label="Time *"
                value={form.appointmentTime || "—"}
                isEditing={isEditing}
                type="time"
                onChange={(v) => updateForm("appointmentTime", v)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Duration (min)"
                value={form.durationMinutes}
                isEditing={isEditing}
                type={isEditing ? "select" : "number"}
                options={[
                  { value: "15", label: "15 minutes" },
                  { value: "20", label: "20 minutes" },
                  { value: "30", label: "30 minutes" },
                  { value: "45", label: "45 minutes" },
                  { value: "60", label: "60 minutes" },
                ]}
                onChange={(v) => updateForm("durationMinutes", v)}
                unit={!isEditing ? "min" : undefined}
              />
              <div className="flex flex-col justify-start">
                {isEditing ? (
                  <EditableField
                    label="Priority"
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
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Priority</span>
                    <PriorityBadge priority={form.priority === "high" ? "HIGH" : form.priority === "low" ? "LOW" : "NORMAL"} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appointment Information">
          <div className="space-y-4">
            <EditableField 
              label="Service Type *" 
              value={form.serviceType} 
              isEditing={isEditing} 
              type={isEditing ? "select" : "text"}
              options={serviceOptions}
              onChange={(v) => updateForm("serviceType", v)} 
            />
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

      <div className="mt-8 mb-4">
        <div className="bg-card border border-border rounded-xl card-shadow p-2 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => reminderMutation.mutate()}
            disabled={!canRemind || reminderMutation.isPending}
            title="Send reminder email to customer"
          >
            <Bell className="h-4 w-4 mr-2" />
            {reminderMutation.isPending ? "Sending..." : "Send Reminder"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => setIsEditing(true)}
            disabled={!canReschedule}
            title="Reschedule appointment (edit date/time)"
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            Reschedule
          </Button>
          <Button
            variant="cancel"
            className="flex-1 h-11"
            onClick={() => {
              const ok = window.confirm("Cancel this appointment?");
              if (!ok) return;
              cancelMutation.mutate();
            }}
            disabled={!canCancel || cancelMutation.isPending}
            title="Cancel appointment"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
