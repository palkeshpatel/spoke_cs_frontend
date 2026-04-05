import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customers } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';

export default function CustomerList() {
  const [search, setSearch] = useState('');
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} customers`}
        actions={<Link to="/customers/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Customer</Button></Link>}
      />

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Phone</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Total Orders</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/customers/${c.id}`} className="text-sm font-medium text-foreground hover:text-primary">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
