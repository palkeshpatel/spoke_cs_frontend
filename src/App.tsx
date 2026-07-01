import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import { clearAuthToken, getAuthToken } from "@/services/api";
import { getMe } from "@/services/auth";
import Dashboard from "@/views/Dashboard";
import CustomerList from "@/views/CustomerList";
import CustomerDetail from "@/views/CustomerDetail";
import CustomerNew from "@/views/CustomerNew";
import AppointmentList from "@/views/AppointmentList";
import AppointmentDetail from "@/views/AppointmentDetail";
import AppointmentNew from "@/views/AppointmentNew";
import MeasurementList from "@/views/MeasurementList";
import MeasurementNew from "@/views/MeasurementNew";
import OrderList from "@/views/OrderList";
import OrderDetail from "@/views/OrderDetail";
import OrderNew from "@/views/OrderNew";
import BillingList from "@/views/BillingList";
import BillingDetail from "@/views/BillingDetail";
import InvoiceNew from "@/views/InvoiceNew";
import Reports from "@/views/Reports";
import SettingsPage from "@/views/SettingsPage";
import Login from "@/views/Login";
import NotFound from "@/views/NotFound";
import StaffActivityMonitor from "@/views/StaffActivityMonitor";
import WorkReports from "@/views/WorkReports";
import StaffList from "@/views/StaffList";
import StaffNew from "@/views/StaffNew";
import RoleList from "@/views/RoleList";
import RoleDetail from "@/views/RoleDetail";
import CustomizationSettings from "@/views/CustomizationSettings";
import CalendarView from "@/views/CalendarView";
import Wishes from "@/views/Wishes";

const queryClient = new QueryClient();

function RequireAuth() {
  const location = useLocation();
  const [phase, setPhase] = useState<"checking" | "ready" | "denied">("checking");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setPhase("denied");
      return;
    }
    let cancelled = false;
    getMe()
      .then(() => {
        if (!cancelled) setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          setPhase("denied");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "checking") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Verifying session…
      </div>
    );
  }
  if (phase === "denied") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/new" element={<CustomerNew />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/appointments" element={<AppointmentList />} />
              <Route path="/appointments/new" element={<AppointmentNew />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/measurements" element={<MeasurementList />} />
              <Route path="/measurements/new" element={<MeasurementNew />} />
              <Route path="/measurements/:id" element={<MeasurementNew />} />
              <Route path="/orders" element={<OrderList />} />
              <Route path="/orders/new" element={<OrderNew />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/wishes" element={<Wishes />} />
              <Route path="/billing" element={<BillingList />} />
              <Route path="/billing/new" element={<InvoiceNew />} />
              <Route path="/billing/:id" element={<BillingDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/staff-monitoring" element={<StaffActivityMonitor />} />
              <Route path="/work-reports" element={<WorkReports />} />
              <Route path="/staff" element={<StaffList />} />
              <Route path="/staff/new" element={<StaffNew />} />
              <Route path="/staff/edit/:id" element={<StaffNew />} />
              <Route path="/settings/roles" element={<RoleList />} />
              <Route path="/settings/roles/new" element={<RoleDetail />} />
              <Route path="/settings/roles/edit/:id" element={<RoleDetail />} />
              <Route path="/settings/customizations" element={<CustomizationSettings />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
