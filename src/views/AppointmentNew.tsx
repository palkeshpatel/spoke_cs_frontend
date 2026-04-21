import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelect from "@/components/CustomerSelect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { createAppointment, listAppointmentServices, listCustomers } from "@/services/appointments";
import { createCustomer } from "@/services/customers";
import { UserPlus } from "lucide-react";

export default function AppointmentNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string>("");
  const [customerMode, setCustomerMode] = useState<"select" | "create">("select");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    if (cid) setCustomerId(cid);
    const ad = params.get("appointment_date");
    if (ad && /^\d{4}-\d{2}-\d{2}$/.test(ad)) setAppointmentDate(ad);
  }, [location.search]);
  const [serviceType, setServiceType] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [trialDate, setTrialDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("30");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [notes, setNotes] = useState<string>("");

  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
  });

  const createCustomerMutation = useMutation({
    mutationFn: () =>
      createCustomer({
        name: newCustomerName.trim(),
        email: newCustomerEmail.trim() ? newCustomerEmail.trim() : null,
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
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Create failed", description: message || "Unable to create customer.", variant: "destructive" });
    },
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
      trial_date: trialDate ? trialDate : null,
      delivery_date: deliveryDate ? deliveryDate : null,
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
        <SectionCard
          title="Customer Details"
          headerActions={
            customerMode === "select" ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setCustomerMode("create")} className="h-8">
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            ) : (
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
          }
        >
          <div className="space-y-4">
            {customerMode === "select" ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Customer *</label>
                <CustomerSelect
                  customers={customersQuery.data?.data || []}
                  value={customerId}
                  onChange={setCustomerId}
                  isLoading={customersQuery.isLoading}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                  <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Customer name" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                    <Input value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="email@example.com" />
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
                      createCustomerMutation.mutate();
                    }}
                    disabled={createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending ? "Saving..." : "Save customer"}
                  </Button>
                </div>
              </div>
            )}
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trial Date</label>
                <Input type="date" value={trialDate} onChange={(e) => setTrialDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Delivery Date</label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
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
