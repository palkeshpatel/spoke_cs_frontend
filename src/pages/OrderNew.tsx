import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OrderNew() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="New Order" subtitle="Create a new order" backTo="/orders" />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <SectionCard title="Order Details">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Customer *</label><Input placeholder="Enter customer name" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Garment Type *</label>
              <Select><SelectTrigger><SelectValue placeholder="Select garment type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="suit">Custom Suit</SelectItem>
                  <SelectItem value="shirt">Dress Shirt</SelectItem>
                  <SelectItem value="pants">Dress Pants</SelectItem>
                  <SelectItem value="blazer">Custom Blazer</SelectItem>
                  <SelectItem value="alteration">Alteration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Delivery Date *</label><Input type="date" /></div>
          </div>
        </SectionCard>

        <SectionCard title="Fabric & Style">
          <div className="space-y-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Fabric</label><Input placeholder="e.g. Italian Wool - Navy Blue" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Price ($)</label><Input type="number" placeholder="0.00" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label><Textarea placeholder="Add order notes..." rows={3} /></div>
          </div>
        </SectionCard>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate('/orders')}>Cancel</Button>
        <Button onClick={() => navigate('/orders')}>Create Order</Button>
      </div>
    </div>
  );
}
