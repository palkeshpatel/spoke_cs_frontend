import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getInvoice } from "@/services/invoices";

function num(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function BillingDetail() {
  const { id } = useParams();
  const invoiceId = id ? Number(id) : NaN;

  const invoiceQuery = useQuery({
    queryKey: ["invoices", "detail", invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: Number.isFinite(invoiceId),
  });

  if (!Number.isFinite(invoiceId)) {
    return <div className="p-8 text-center text-muted-foreground">Invalid invoice</div>;
  }

  if (invoiceQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading invoice…</div>;
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return <div className="p-8 text-center text-muted-foreground">Invoice not found</div>;
  }

  const inv = invoiceQuery.data;
  const customerName = inv.customer?.name ?? "—";
  const orderLabel = inv.order?.order_number ?? (inv.order_id ? `Order #${inv.order_id}` : "—");
  const items = inv.items ?? [];
  const payments = inv.payments ?? [];

  return (
    <div>
      <PageHeader title={`Invoice ${inv.invoice_number}`} subtitle={customerName} backTo="/billing" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Invoice details">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={inv.status} />
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium text-right">{customerName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Order</span>
              <span className="font-medium text-right">{orderLabel}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Invoice date</span>
              <span className="font-medium text-right">
                {inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${num(inv.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium">${num(inv.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${num(inv.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-border pt-3">
              <span className="text-muted-foreground">Grand total</span>
              <span className="text-lg font-bold">${num(inv.grand_total).toFixed(2)}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Payments">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">${num(p.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{p.payment_method ?? "Payment"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {p.paid_at ? format(new Date(p.paid_at), "dd MMM yyyy") : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Line items">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items on this invoice.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground py-2">Description</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-2">Qty</th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-2">Price</th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const price = num(item.price);
                  const line = num(item.total);
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="text-sm py-2">{item.description}</td>
                      <td className="text-sm py-2">{item.quantity}</td>
                      <td className="text-sm py-2 text-right">${price.toFixed(2)}</td>
                      <td className="text-sm py-2 text-right">${line.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
