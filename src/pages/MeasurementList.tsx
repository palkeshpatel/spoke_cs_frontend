import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { measurements } from '@/data/mockData';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Ruler } from 'lucide-react';

export default function MeasurementList() {
  const [search, setSearch] = useState('');
  const filtered = measurements.filter(m => m.customerName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Measurements" subtitle="Customer measurement records" />

      <div className="bg-card rounded-xl card-shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by customer name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(m => (
          <Link to={`/measurements/${m.id}`} key={m.id} className="bg-card rounded-xl card-shadow p-5 hover:card-shadow-hover transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Ruler className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{m.customerName}</p>
                  <p className="text-xs text-muted-foreground">Updated {m.lastUpdated}</p>
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>
            <div className="flex gap-2">
              {m.garmentTypes.map(g => (
                <span key={g} className="text-xs border border-border rounded-full px-2.5 py-0.5">{g}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
