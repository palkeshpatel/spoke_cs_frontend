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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { AppointmentCalendarDayCell, AppointmentCalendarProvider } from "@/components/AppointmentCalendarDay";
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

  const appointmentTabTriggerClass =
    "rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:text-foreground";

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
        <TabsList className="mb-4 flex h-auto w-full gap-1 rounded-lg border border-border/60 bg-muted/50 p-1 sm:w-fit">
          <TabsTrigger value="list" className={appointmentTabTriggerClass}>
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className={appointmentTabTriggerClass}>
            Calendar View
          </TabsTrigger>
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
        </TabsContent>

        <TabsContent value="calendar">
          <div className="w-full max-w-full">
            <div className="rounded-xl border border-border/60 bg-muted/15 p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Loading…" : `${appointments.length} scheduled`}
                </p>
                <Link to="/appointments/new">
                  <Button size="sm" className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Appointment
                  </Button>
                </Link>
              </div>
              <AppointmentCalendarProvider appointments={appointments}>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="pointer-events-auto w-full max-w-full border-0 bg-transparent p-0 shadow-none [--rdp-day-width:100%] [--rdp-day-height:auto] [--rdp-day_button-width:auto] [--rdp-day_button-height:auto] [&_.rdp-day]:!h-auto [&_.rdp-day]:min-h-[5.5rem] [&_.rdp-day]:overflow-visible"
                  components={{ Day: AppointmentCalendarDayCell }}
                  classNames={{
                    root: "w-full",
                    months: "w-full",
                    month: "relative w-full space-y-2",
                    month_caption: "flex h-9 items-center justify-center",
                    caption_label: "text-sm font-semibold text-foreground",
                    nav: "absolute inset-x-0 top-0 z-[1] flex items-center justify-between px-1",
                    button_previous:
                      "relative h-8 w-8 rounded-md border border-border/60 bg-card text-foreground shadow-sm hover:bg-muted aria-disabled:opacity-40",
                    button_next:
                      "relative h-8 w-8 rounded-md border border-border/60 bg-card text-foreground shadow-sm hover:bg-muted aria-disabled:opacity-40",
                    month_grid: "w-full table-fixed border-collapse",
                    weekdays: "border-b border-border/40",
                    weekday: "w-[14.28%] p-1 text-center text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground",
                    day: "box-border !h-auto min-h-[5.5rem] w-[14.28%] overflow-visible align-top p-0.5",
                    day_button:
                      "mx-auto flex h-7 min-h-7 w-8 min-w-8 shrink-0 items-center justify-center rounded-md p-0 text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:shadow-sm",
                  }}
                />
              </AppointmentCalendarProvider>
              <p className="mt-3 text-xs text-muted-foreground">
                Tap a <span className="font-medium text-foreground">brown bar</span> to open that appointment. Day number selects the day for highlighting.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
