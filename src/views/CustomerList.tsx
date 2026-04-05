import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { listCustomers } from "@/services/customers";

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const customersQuery = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers(200),
  });

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const email = c.email ?? "";
      return c.name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || c.customer_code.toLowerCase().includes(q);
    });
  }, [customers, search]);

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
              {customersQuery.isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                    No customers found
                  </td>
                </tr>
              ) : (
              filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/customers/${c.id}`} className="text-sm font-medium text-foreground hover:text-primary">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.orders_count ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.loyalty?.last_visit ?? "—"}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
