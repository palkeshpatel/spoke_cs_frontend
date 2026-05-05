import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { orders, customers, invoices } from '@/data/mockData';

const monthlyRevenue = [
  { month: 'Oct', revenue: 8200 }, { month: 'Nov', revenue: 9100 },
  { month: 'Dec', revenue: 11500 }, { month: 'Jan', revenue: 10200 },
  { month: 'Feb', revenue: 9800 }, { month: 'Mar', revenue: 12450 },
];

const ordersPerMonth = [
  { month: 'Oct', orders: 12 }, { month: 'Nov', orders: 15 },
  { month: 'Dec', orders: 18 }, { month: 'Jan', orders: 14 },
  { month: 'Feb', orders: 11 }, { month: 'Mar', orders: 16 },
];

const topCustomers = customers.sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);

export default function Reports() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Business analytics and insights</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyRevenue}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(239, 84%, 67%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Orders Per Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ordersPerMonth}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="hsl(263, 70%, 58%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Top Customers</h3>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-semibold">{c.totalOrders} orders</p>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}
