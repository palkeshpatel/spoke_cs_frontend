import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { customers, orders, appointments, measurements, invoices } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EditableField from '@/components/EditableField';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';

export default function CustomerDetail() {
  const { id } = useParams();
  const customer = customers.find(c => c.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(customer || customers[0]);

  if (!customer) return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;

  const customerOrders = orders.filter(o => o.customerId === id);
  const customerAppts = appointments.filter(a => a.customerId === id);
  const customerInvoices = invoices.filter(i => i.customerId === id);

  const update = (key: keyof typeof form, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={`Customer since ${customer.lastVisit}`}
        backTo="/customers"
        isEditing={isEditing}
        onEdit={() => { setForm(customer); setIsEditing(true); }}
        onSave={() => setIsEditing(false)}
        onCancel={() => { setForm(customer); setIsEditing(false); }}
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Customer Information" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="grid sm:grid-cols-2 gap-4">
            <EditableField label="Name" value={form.name} isEditing={isEditing} onChange={v => update('name', v)} />
            <EditableField label="Phone" value={form.phone} isEditing={isEditing} onChange={v => update('phone', v)} />
            <EditableField label="Email" value={form.email} isEditing={isEditing} onChange={v => update('email', v)} />
            <EditableField label="Address" value={form.address} isEditing={isEditing} onChange={v => update('address', v)} />
          </div>
        </SectionCard>

        <SectionCard title="Preferences" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Fit Preferences" value={form.preferences} isEditing={isEditing} onChange={v => update('preferences', v)} />
            <EditableField label="Notes" value={form.notes} isEditing={isEditing} type="textarea" onChange={v => update('notes', v)} />
          </div>
        </SectionCard>
      </div>

      {/* Orders */}
      <SectionCard title="Orders" className="mb-6">
        {customerOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {customerOrders.map(o => (
              <Link to={`/orders/${o.id}`} key={o.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{o.garmentType}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-semibold">${o.total.toFixed(2)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Appointments */}
        <SectionCard title="Appointments">
          {customerAppts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments</p>
          ) : (
            <div className="space-y-2">
              {customerAppts.map(a => (
                <Link to={`/appointments/${a.id}`} key={a.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.service}</p>
                    <p className="text-xs text-muted-foreground">{a.date} · {a.time}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Billing */}
        <SectionCard title="Billing History">
          {customerInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices</p>
          ) : (
            <div className="space-y-2">
              {customerInvoices.map(inv => (
                <Link to={`/billing/${inv.id}`} key={inv.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{inv.service}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold">${inv.amount.toFixed(2)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
