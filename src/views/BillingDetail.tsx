import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { invoices } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EditableField from '@/components/EditableField';
import { StatusBadge } from '@/components/StatusBadge';

export default function BillingDetail() {
  const { id } = useParams();
  const inv = invoices.find(i => i.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(inv || invoices[0]);

  if (!inv) return <div className="p-8 text-center text-muted-foreground">Invoice not found</div>;

  return (
    <div>
      <PageHeader
        title={`Invoice ${inv.invoiceNumber}`}
        subtitle={inv.customerName}
        backTo="/billing"
        isEditing={isEditing}
        onEdit={() => { setForm(inv); setIsEditing(true); }}
        onSave={() => setIsEditing(false)}
        onCancel={() => { setForm(inv); setIsEditing(false); }}
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Customer Information" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <EditableField label="Customer" value={form.customerName} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, customerName: v }))} />
              <StatusBadge status={form.status} />
            </div>
            <EditableField label="Order" value={form.orderNumber} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, orderNumber: v }))} />
            <EditableField label="Service" value={form.service} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, service: v }))} />
            <EditableField label="Date" value={form.date} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, date: v }))} />
          </div>
        </SectionCard>

        <SectionCard title="Payment Information" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Payment Method" value={form.paymentMethod || 'Not paid'} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, paymentMethod: v }))} />
            <EditableField label="Payment Date" value={form.paymentDate || 'N/A'} isEditing={isEditing} onChange={v => setForm(f => ({ ...f, paymentDate: v }))} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Invoice Breakdown">
        <div className="overflow-x-auto">
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-2">Description</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2">Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2">Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="text-sm py-2">{item.description}</td>
                  <td className="text-sm py-2">{item.quantity}</td>
                  <td className="text-sm py-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="text-sm py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-border pt-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">${inv.amount.toFixed(2)}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
