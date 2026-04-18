import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getCustomer } from "@/services/customers";
import { createInvoice } from "@/services/invoices";

export default function InvoiceNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const customerId = useMemo(() => {
    const p = new URLSearchParams(location.search);
    const v = p.get("customer_id");
    if (!v) return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }, [location.search]);

  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createInvoice({
        customer_id: customerId,
        invoice_date: invoiceDate || null,
        status: "pending",
        items: [],
      }),
    onSuccess: async (inv) => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice created", description: `${inv.invoice_number} is ready to edit.` });
      navigate(`/billing/${inv.id}`);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
      toast({ title: "Create failed", description: message || "Unable to create invoice.", variant: "destructive" });
    },
  });

  if (!Number.isFinite(customerId)) {
    return (
      <div>
        <PageHeader title="New Invoice" subtitle="Create an invoice for a customer" backTo="/billing" />
        <SectionCard title="">
          <p className="text-sm text-muted-foreground mb-4">
            Start from a customer profile using <strong>New Invoice</strong>, or pick a customer from the list.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/customers">Customers</Link>
          </Button>
        </SectionCard>
      </div>
    );
  }

  if (customerQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  if (!customerQuery.data) {
    return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;
  }

  const c = customerQuery.data;

  return (
    <div>
      <PageHeader title="New Invoice" subtitle={`Draft for ${c.name}`} backTo={`/customers/${customerId}`} />

      <SectionCard title="Invoice">
        <div className="space-y-4 max-w-md">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Customer</p>
            <p className="text-sm font-medium">
              {c.name} <span className="text-muted-foreground">({c.customer_code})</span>
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Invoice date</label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            A draft invoice with no line items will be created. You can add items from the invoice screen when that flow is available.
          </p>
        </div>
      </SectionCard>

      <div className="flex gap-2 justify-end mt-6">
        <Button variant="cancel" asChild>
          <Link to={`/customers/${customerId}`}>Cancel</Link>
        </Button>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating…" : "Create draft invoice"}
        </Button>
      </div>
    </div>
  );
}
