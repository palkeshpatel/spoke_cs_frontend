import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function CustomerNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', preferences: '', notes: '' });
  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

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
        <Button onClick={() => navigate('/customers')}>Create Customer</Button>
      </div>
    </div>
  );
}
