import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { listAppointments } from "@/services/appointments";

function formatAppointmentTime(t: string | null | undefined): string {
  if (!t) return "—";
  const parts = t.split(":");
  if (parts.length >= 2) return parts.slice(0, 3).join(":");
  return t;
}

export default function AppointmentList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "list"],
    queryFn: () => listAppointments(200),
  });

  const appointments = useMemo(() => data?.data ?? [], [data]);

  const filtered = appointments.filter((a) => {
    const customerName = a.customer?.name ?? "";
    const matchSearch =
      customerName.toLowerCase().includes(search.toLowerCase()) || a.service_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchService = serviceFilter === "all" || a.service_type.toLowerCase().includes(serviceFilter.toLowerCase());
    return matchSearch && matchStatus && matchService;
  });

  const todayCount = appointments.filter((a) => {
    if (!a.appointment_date) return false;
    const date = new Date(a.appointment_date);
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;

  const upcomingCount = appointments.filter((a) => {
    if (!a.appointment_date || a.status === 'completed' || a.status === 'cancelled') return false;
    const date = new Date(a.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }).length;

  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={`${appointments.length} appointments`}
        actions={
          <Link to="/appointments/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Today</div>
            <div className="text-2xl font-bold">{todayCount}</div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Upcoming</div>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </div>
        </div>

        <div className="bg-card rounded-xl card-shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Completed</div>
            <div className="text-2xl font-bold">{completedCount}</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, service, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="suit">Suit</SelectItem>
                <SelectItem value="shirt">Shirt</SelectItem>
                <SelectItem value="pants">Pants</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading appointments...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No appointments found</div>
          ) : (
            filtered.map((a) => (
              <Link to={`/appointments/${a.id}`} key={a.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`w-1 h-10 sm:h-14 rounded-full shrink-0 ${a.priority === "high" ? "bg-destructive" : "bg-primary"}`} />
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center shrink-0">
                    <span className="text-primary text-sm">👤</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{a.customer?.name ?? "—"}</p>
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                        {a.customer?.customer_code ?? `C${String(a.customer_id).padStart(3, "0")}`}
                      </span>
                    </div>
                    <p className="text-sm text-primary font-medium bg-gradient-to-r from-primary/10 to-accent/10 px-2 py-1 rounded-md inline-block">{a.service_type}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0 flex-wrap">
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="truncate">
                          {a.appointment_date ? format(new Date(a.appointment_date), "dd-MMM-yyyy") : "—"}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="truncate">
                          {formatAppointmentTime(a.appointment_time)} ({a.duration_minutes} min)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <StatusBadge status={a.status} />
                  <div className="mt-1">
                    <PriorityBadge priority={a.priority === "high" ? "HIGH" : a.priority === "low" ? "LOW" : "NORMAL"} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
