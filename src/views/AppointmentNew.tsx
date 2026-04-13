import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { createAppointment, listAppointmentServices, listCustomers } from "@/services/appointments";

export default function AppointmentNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("30");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [notes, setNotes] = useState<string>("");

  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
  });

  const servicesQuery = useQuery({
    queryKey: ["appointment-services", "list"],
    queryFn: () => listAppointmentServices(),
  });

  const selectedCustomer = useMemo(() => {
    const id = Number(customerId);
    return customersQuery.data?.data.find((c) => c.id === id);
  }, [customerId, customersQuery.data]);

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Appointment created", description: `Appointment #${created.id} created.` });
      navigate(`/appointments/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({
        title: "Create failed",
        description: message || "Unable to create appointment.",
        variant: "destructive",
      });
    },
  });

  const submit = () => {
    if (!customerId) {
      toast({ title: "Customer required", description: "Please select a customer.", variant: "destructive" });
      return;
    }
    if (!serviceType) {
      toast({ title: "Service required", description: "Please select a service.", variant: "destructive" });
      return;
    }
    if (!appointmentDate) {
      toast({ title: "Date required", description: "Please select a date.", variant: "destructive" });
      return;
    }

    const time = appointmentTime ? `${appointmentTime}:00` : null;
    createMutation.mutate({
      customer_id: Number(customerId),
      service_type: serviceType,
      appointment_date: appointmentDate,
      appointment_time: time,
      duration_minutes: Number(durationMinutes || 0),
      priority,
      status: "confirmed",
      notes: notes || null,
    });
  };

  return (
    <div>
      <PageHeader title="New Appointment" subtitle="Schedule a new appointment for your customer" backTo="/appointments" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Customer Details">
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                <Input value={selectedCustomer?.phone ?? ""} placeholder="—" disabled />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input value={selectedCustomer?.email ?? ""} placeholder="—" disabled />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appointment Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Service Type *</label>
              <Select value={serviceType} onValueChange={(v) => {
                setServiceType(v);
                const svc = servicesQuery.data?.find((s) => s.service_name === v);
                if (svc) setDurationMinutes(String(svc.duration_minutes));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={servicesQuery.isLoading ? "Loading services..." : "Select service"} />
                </SelectTrigger>
                <SelectContent>
                  {(servicesQuery.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.service_name}>
                      {s.service_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
                <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                <Input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
                <Select value={durationMinutes} onValueChange={setDurationMinutes}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "normal" | "high")}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Notes" className="mb-6">
        <Textarea placeholder="Add any special instructions or notes..." rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </SectionCard>

      <div className="flex gap-2 justify-end">
        <Button variant="cancel" onClick={() => navigate('/appointments')}>Cancel</Button>
        <Button onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Appointment"}
        </Button>
      </div>
    </div>
  );
}
