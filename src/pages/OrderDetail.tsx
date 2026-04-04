import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { orders } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EditableField from '@/components/EditableField';
import { StatusBadge } from '@/components/StatusBadge';

export default function OrderDetail() {
  const { id } = useParams();
  const order = orders.find(o => o.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(order || orders[0]);

  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found</div>;

  const update = (key: keyof typeof form, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={order.customerName}
        backTo="/orders"
        isEditing={isEditing}
        onEdit={() => { setForm(order); setIsEditing(true); }}
        onSave={() => setIsEditing(false)}
        onCancel={() => { setForm(order); setIsEditing(false); }}
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Information" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <EditableField label="Order Number" value={form.orderNumber} isEditing={isEditing} onChange={v => update('orderNumber', v)} />
              <StatusBadge status={form.status} />
            </div>
            <EditableField label="Customer" value={form.customerName} isEditing={isEditing} onChange={v => update('customerName', v)} />
            <EditableField label="Garment Type" value={form.garmentType} isEditing={isEditing} onChange={v => update('garmentType', v)} />
            <EditableField label="Delivery Date" value={form.deliveryDate} isEditing={isEditing} onChange={v => update('deliveryDate', v)} />
          </div>
        </SectionCard>

        <SectionCard title="Fabric & Style" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Fabric Selection" value={form.fabric} isEditing={isEditing} onChange={v => update('fabric', v)} />
            <EditableField label="Notes" value={form.notes || 'No notes'} isEditing={isEditing} type="textarea" onChange={v => update('notes', v)} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Price Breakdown" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
        <div className="overflow-x-auto">
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-2">Description</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2">Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="text-sm py-2">{item.description}</td>
                  <td className="text-sm py-2">{item.quantity}</td>
                  <td className="text-sm py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-border pt-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
