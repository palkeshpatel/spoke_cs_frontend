import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import { getAuthToken } from "@/services/api";
import Dashboard from "@/views/Dashboard";
import CustomerList from "@/views/CustomerList";
import CustomerDetail from "@/views/CustomerDetail";
import CustomerNew from "@/views/CustomerNew";
import AppointmentList from "@/views/AppointmentList";
import AppointmentDetail from "@/views/AppointmentDetail";
import AppointmentNew from "@/views/AppointmentNew";
import MeasurementList from "@/views/MeasurementList";
import MeasurementDetail from "@/views/MeasurementDetail";
import OrderList from "@/views/OrderList";
import OrderDetail from "@/views/OrderDetail";
import OrderNew from "@/views/OrderNew";
import BillingList from "@/views/BillingList";
import BillingDetail from "@/views/BillingDetail";
import Reports from "@/views/Reports";
import SettingsPage from "@/views/SettingsPage";
import Login from "@/views/Login";
import NotFound from "@/views/NotFound";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: ReactElement }) => {
  const location = useLocation();
  const token = getAuthToken();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

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
          <Route path="*" element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/customers/new" element={<CustomerNew />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/appointments" element={<AppointmentList />} />
                  <Route path="/appointments/new" element={<AppointmentNew />} />
                  <Route path="/appointments/:id" element={<AppointmentDetail />} />
                  <Route path="/measurements" element={<MeasurementList />} />
                  <Route path="/measurements/:id" element={<MeasurementDetail />} />
                  <Route path="/orders" element={<OrderList />} />
                  <Route path="/orders/new" element={<OrderNew />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/billing" element={<BillingList />} />
                  <Route path="/billing/:id" element={<BillingDetail />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </RequireAuth>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
