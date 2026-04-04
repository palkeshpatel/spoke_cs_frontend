import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { orders } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';

export default function OrderList() {
  const [search, setSearch] = useState('');
  const filtered = orders.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} orders`}
        actions={<Link to="/orders/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Order</Button></Link>}
      />

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Order #', 'Customer', 'Garment', 'Fabric', 'Delivery', 'Status', 'Total'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3"><Link to={`/orders/${o.id}`} className="text-sm font-medium hover:text-primary">{o.orderNumber}</Link></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{o.customerName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{o.garmentType}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{o.fabric}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{o.deliveryDate}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-sm font-semibold">${o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
