import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AppointmentNew() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="New Appointment" subtitle="Schedule a new appointment for your customer" backTo="/appointments" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Customer Details">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Customer Name *</label><Input placeholder="Enter customer name" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Phone Number</label><Input placeholder="+1 234-567-8900" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Email</label><Input placeholder="email@example.com" /></div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appointment Details">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Service Type *</label>
              <Select><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="suit-fitting">Suit Fitting</SelectItem>
                  <SelectItem value="shirt-measurement">Shirt Measurement</SelectItem>
                  <SelectItem value="pants-alteration">Pants Alteration</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Date *</label><Input type="date" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Time *</label>
                <Select><SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    {['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'].map(t =>
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
                <Select defaultValue="30"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <Select defaultValue="NORMAL"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Notes" className="mb-6">
        <Textarea placeholder="Add any special instructions or notes..." rows={4} />
      </SectionCard>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate('/appointments')}>Cancel</Button>
        <Button onClick={() => navigate('/appointments')}>Create Appointment</Button>
      </div>
    </div>
  );
}
