import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EditableField from '@/components/EditableField';

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    shopName: 'SPOKE Tailoring',
    phone: '+1 234-567-8900',
    email: 'info@spoke-tailoring.com',
    address: '123 Fashion Ave, New York, NY 10001',
    currency: 'USD',
    timezone: 'America/New_York',
    businessHours: '9:00 AM - 6:00 PM',
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your shop settings"
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <SectionCard title="Shop Information" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Shop Name" value={form.shopName} isEditing={isEditing} onChange={v => update('shopName', v)} />
            <EditableField label="Phone" value={form.phone} isEditing={isEditing} onChange={v => update('phone', v)} />
            <EditableField label="Email" value={form.email} isEditing={isEditing} onChange={v => update('email', v)} />
            <EditableField label="Address" value={form.address} isEditing={isEditing} onChange={v => update('address', v)} />
          </div>
        </SectionCard>

        <SectionCard title="Business Settings" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Currency" value={form.currency} isEditing={isEditing} onChange={v => update('currency', v)} />
            <EditableField label="Timezone" value={form.timezone} isEditing={isEditing} onChange={v => update('timezone', v)} />
            <EditableField label="Business Hours" value={form.businessHours} isEditing={isEditing} onChange={v => update('businessHours', v)} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
