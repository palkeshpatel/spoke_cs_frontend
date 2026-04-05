import { Users, Package, Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { customers, orders, appointments, invoices } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const stats = [
  { label: 'Total Customers', value: customers.length, icon: Users, color: 'text-primary' },
  { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-accent' },
  { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length, icon: Clock, color: 'text-warning' },
  { label: 'Completed Orders', value: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length, icon: CheckCircle, color: 'text-success' },
  { label: 'Revenue This Month', value: `$${invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}`, icon: DollarSign, color: 'text-success' },
  { label: 'Pending Revenue', value: `$${invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}`, icon: TrendingUp, color: 'text-destructive' },
];

const monthlyData = [
  { month: 'Oct', revenue: 8200 }, { month: 'Nov', revenue: 9100 },
  { month: 'Dec', revenue: 11500 }, { month: 'Jan', revenue: 10200 },
  { month: 'Feb', revenue: 9800 }, { month: 'Mar', revenue: 12450 },
];

const orderStatusData = [
  { name: 'Pending', value: 2, color: 'hsl(38, 92%, 50%)' },
  { name: 'In Progress', value: 2, color: 'hsl(199, 89%, 48%)' },
  { name: 'Completed', value: 1, color: 'hsl(142, 76%, 36%)' },
  { name: 'Delivered', value: 1, color: 'hsl(239, 84%, 67%)' },
];

const todaysAppointments = appointments.filter(a => a.date === '2026-03-06');

export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-xl card-shadow p-3 sm:p-4">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(239, 84%, 67%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Order Status</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {orderStatusData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 4).map(o => (
              <Link to={`/orders/${o.id}`} key={o.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.customerName} · {o.garmentType}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-semibold">${o.total.toFixed(2)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Today's Appointments</h3>
            <Link to="/appointments" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {todaysAppointments.map(a => (
              <Link to={`/appointments/${a.id}`} key={a.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.service} · {a.time} ({a.duration})</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <StatusBadge status={a.status} />
                  <p className={`text-xs font-bold mt-1 ${a.priority === 'HIGH' ? 'text-destructive' : 'text-primary'}`}>{a.priority}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
