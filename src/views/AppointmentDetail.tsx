import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { appointments } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EditableField from '@/components/EditableField';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, Phone, Mail, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AppointmentDetail() {
  const { id } = useParams();
  const appt = appointments.find(a => a.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(appt || appointments[0]);
  const [newNote, setNewNote] = useState('');

  if (!appt) return <div className="p-8 text-center text-muted-foreground">Appointment not found</div>;

  const update = (key: keyof typeof form, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <PageHeader
        title="Appointment Details"
        subtitle={`ID: ${id}`}
        backTo="/appointments"
        isEditing={isEditing}
        onEdit={() => { setForm(appt); setIsEditing(true); }}
        onSave={() => setIsEditing(false)}
        onCancel={() => { setForm(appt); setIsEditing(false); }}
        actions={
          <Button size="sm" variant="outline">
            <CheckCircle className="h-4 w-4 mr-1" /> Complete
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Customer Info */}
        <SectionCard title="" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">{form.customerName}</h2>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">C{String(form.customerId).padStart(3, '0')}</span>
                <StatusBadge status={form.status} />
              </div>
              <p className="text-sm text-primary mt-0.5">{form.service}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <EditableField label="Date" value={form.date} isEditing={isEditing} onChange={v => update('date', v)} />
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <EditableField label="Time & Duration" value={`${form.time} · ${form.duration}`} isEditing={isEditing} onChange={v => update('time', v)} />
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <EditableField label="Phone" value={form.phone} isEditing={isEditing} onChange={v => update('phone', v)} />
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <EditableField label="Email" value={form.email} isEditing={isEditing} onChange={v => update('email', v)} />
            </div>
          </div>
          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Priority Level</span>
            {isEditing ? (
              <EditableField label="" value={form.priority} isEditing={isEditing} type="select"
                options={[{ value: 'HIGH', label: 'HIGH' }, { value: 'NORMAL', label: 'NORMAL' }, { value: 'LOW', label: 'LOW' }]}
                onChange={v => update('priority', v)} />
            ) : (
              <PriorityBadge priority={form.priority} />
            )}
          </div>
        </SectionCard>

        {/* Order Information */}
        <SectionCard title="Order Information" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
          <div className="space-y-4">
            <EditableField label="Order Number" value={form.orderNumber} isEditing={isEditing} onChange={v => update('orderNumber', v)} />
            <EditableField label="Fabric Selection" value={form.fabricSelection} isEditing={isEditing} onChange={v => update('fabricSelection', v)} />
            <EditableField label="Style" value={form.style} isEditing={isEditing} onChange={v => update('style', v)} />
            <EditableField label="Estimated Cost" value={`$${form.estimatedCost}`} isEditing={isEditing} onChange={v => update('estimatedCost', Number(v.replace('$', '')))} />
          </div>
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm flex-wrap gap-1">
              <span className="text-muted-foreground">Reminder Status</span>
              <span className="text-success font-medium">{form.reminderStatus}</span>
            </div>
            <div className="flex justify-between text-sm flex-wrap gap-1">
              <span className="text-muted-foreground">Created</span>
              <span>{form.createdDate}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Notes */}
      <SectionCard title="" onEdit={!isEditing ? () => setIsEditing(true) : undefined}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm sm:text-base font-semibold">Appointment Notes</h3>
        </div>
        {isEditing ? (
          <EditableField label="" value={form.notes} isEditing={true} type="textarea" onChange={v => update('notes', v)} />
        ) : (
          <>
            <div className="bg-muted rounded-lg p-3 mb-3">
              <p className="text-sm">{appt.notes}</p>
            </div>
            <Input placeholder="Add a new note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
          </>
        )}
      </SectionCard>
    </div>
  );
}
