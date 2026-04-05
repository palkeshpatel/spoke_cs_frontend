import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { listAppointments } from "@/services/appointments";

export default function AppointmentList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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

  const dateAppointments = selectedDate
    ? appointments.filter((a) => a.appointment_date === selectedDate.toISOString().split("T")[0])
    : [];

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

      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
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
                      <p className="text-sm text-primary">{a.service_type}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        📅 {a.appointment_date} 🕐 {a.appointment_time ?? "—"} ({a.duration_minutes} min)
                      </p>
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
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="pointer-events-auto" />
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-semibold mb-2">Legend</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> Confirmed</div>
                  <div className="flex items-center gap-2 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Pending</div>
                  <div className="flex items-center gap-2 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-destructive" /> High Priority</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl card-shadow p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm sm:text-base font-semibold">
                  Appointments for {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
              {dateAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No appointments scheduled</p>
                  <Link to="/appointments/new"><Button variant="outline" size="sm" className="mt-3"><Plus className="h-4 w-4 mr-1" /> Schedule Appointment</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {dateAppointments.map((a) => (
                    <Link to={`/appointments/${a.id}`} key={a.id} className="block p-3 rounded-lg hover:bg-muted transition-colors">
                      <p className="text-sm font-medium">{a.customer?.name ?? "—"} - {a.service_type}</p>
                      <p className="text-xs text-muted-foreground">{a.appointment_time ?? "—"} ({a.duration_minutes} min)</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
