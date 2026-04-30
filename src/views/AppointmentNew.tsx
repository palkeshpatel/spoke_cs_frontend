import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import CustomerSelectWithAdd from "@/components/CustomerSelectWithAdd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  createAppointment,
  listAppointmentServices,
} from "@/services/appointments";
import { listCustomers } from "@/services/customers";

export default function AppointmentNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [trialDate, setTrialDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("30");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get("customer_id");
    if (cid) setCustomerId(cid);
    const ad = params.get("appointment_date");
    if (ad && /^\d{4}-\d{2}-\d{2}$/.test(ad)) setAppointmentDate(ad);
  }, [location.search]);

  // Keep customers query here only for the read-only phone/email display fields.
  // CustomerSelectWithAdd uses the same cache key so no duplicate API call.
  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
    staleTime: 30_000,
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
      toast({
        title: "Appointment created",
        description: `Appointment #${created.id} created.`,
      });
      navigate(`/appointments/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      toast({
        title: "Create failed",
        description: message || "Unable to create appointment.",
        variant: "destructive",
      });
    },
  });

  const submit = () => {
    if (!customerId) {
      toast({
        title: "Customer required",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }
    if (!serviceType) {
      toast({
        title: "Service required",
        description: "Please select a service.",
        variant: "destructive",
      });
      return;
    }
    if (!appointmentDate) {
      toast({
        title: "Date required",
        description: "Please select a date.",
        variant: "destructive",
      });
      return;
    }

    const time = appointmentTime ? `${appointmentTime}:00` : null;
    createMutation.mutate({
      customer_id: Number(customerId),
      service_type: serviceType,
      appointment_date: appointmentDate,
      appointment_time: time,
      trial_date: trialDate || null,
      delivery_date: deliveryDate || null,
      duration_minutes: Number(durationMinutes || 0),
      priority,
      status: "confirmed",
      notes: notes || null,
    });
  };

  return (
    <div>
      <PageHeader
        title="New Appointment"
        subtitle="Schedule a new appointment for your customer"
        backTo="/appointments"
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* ── Customer Details ── */}
        <SectionCard title="Customer Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Customer *
              </label>
              <CustomerSelectWithAdd
                value={customerId}
                onChange={setCustomerId}
              />
            </div>

            {/* Read-only info fields populated after customer selection */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Phone Number
                </label>
                <Input
                  value={selectedCustomer?.phone ?? ""}
                  placeholder="—"
                  disabled
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Email
                </label>
                <Input
                  value={selectedCustomer?.email ?? ""}
                  placeholder="—"
                  disabled
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Appointment Details ── */}
        <SectionCard title="Appointment Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Service Type *
              </label>
              <Select
                value={serviceType}
                onValueChange={(v) => {
                  setServiceType(v);
                  const svc = servicesQuery.data?.find(
                    (s) => s.service_name === v,
                  );
                  if (svc) setDurationMinutes(String(svc.duration_minutes));
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      servicesQuery.isLoading
                        ? "Loading services..."
                        : "Select service"
                    }
                  />
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
                <label className="text-xs text-muted-foreground mb-1 block">
                  Date *
                </label>
                <Input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Time
                </label>
                <Input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Duration (min)
                </label>
                <Select
                  value={durationMinutes}
                  onValueChange={setDurationMinutes}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Priority
                </label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as "low" | "normal" | "high")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <label className="text-xs text-muted-foreground mb-1 block">
                  Trial Date
                </label>
                <Input
                  type="date"
                  value={trialDate}
                  onChange={(e) => setTrialDate(e.target.value)}
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
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Notes" className="mb-6">
        <Textarea
          placeholder="Add any special instructions or notes..."
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </SectionCard>

      <div className="flex gap-2 justify-end">
        <Button variant="cancel" onClick={() => navigate("/appointments")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Appointment"}
        </Button>
      </div>
    </div>
  );
}
