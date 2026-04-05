import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createCustomer } from "@/services/customers";

export default function CustomerNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", preferences: "", notes: "" });
  const update = (key: keyof typeof form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer created", description: `Customer ${created.customer_code} created.` });
      navigate(`/customers/${created.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Create failed", description: message || "Unable to create customer.", variant: "destructive" });
    },
  });

  const submit = () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter customer name.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      preferences: {
        fit_preference: form.preferences.trim() || null,
        favorite_colors: null,
        notes: form.notes.trim() || null,
      },
    });
  };

  return (
    <div>
      <PageHeader title="Add Customer" subtitle="Create a new customer profile" backTo="/customers" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Customer Information">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Name *</label><Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter customer name" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label><Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 234-567-8900" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Email</label><Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@example.com" /></div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Address</label><Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Enter address" /></div>
          </div>
        </SectionCard>

        <SectionCard title="Preferences">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Fit Preferences</label><Input value={form.preferences} onChange={e => update('preferences', e.target.value)} placeholder="e.g. Slim Fit, Navy colors" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Add any notes..." rows={4} /></div>
          </div>
        </SectionCard>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate('/customers')}>Cancel</Button>
        <Button onClick={submit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Customer"}
        </Button>
      </div>
    </div>
  );
}
