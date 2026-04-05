import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, DollarSign, Receipt as ReceiptIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { invoices } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BillingList() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.customerName.toLowerCase().includes(search.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'all' || inv.status === tab;
    return matchSearch && matchTab;
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader title="Billing" subtitle="Invoices and payments" />

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-success" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center"><ReceiptIcon className="h-5 w-5 text-warning" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Pending Amount</p>
            <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center"><ReceiptIcon className="h-5 w-5 text-info" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{invoices.length}</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="divide-y divide-border">
          {filtered.map(inv => (
            <Link to={`/billing/${inv.id}`} key={inv.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <ReceiptIcon className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{inv.invoiceNumber}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{inv.customerName}</p>
                  <p className="text-xs text-muted-foreground">{inv.service}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${inv.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
