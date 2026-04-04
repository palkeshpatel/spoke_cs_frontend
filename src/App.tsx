import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CustomerList from "@/pages/CustomerList";
import CustomerDetail from "@/pages/CustomerDetail";
import CustomerNew from "@/pages/CustomerNew";
import AppointmentList from "@/pages/AppointmentList";
import AppointmentDetail from "@/pages/AppointmentDetail";
import AppointmentNew from "@/pages/AppointmentNew";
import MeasurementList from "@/pages/MeasurementList";
import MeasurementDetail from "@/pages/MeasurementDetail";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import OrderNew from "@/pages/OrderNew";
import BillingList from "@/pages/BillingList";
import BillingDetail from "@/pages/BillingDetail";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={
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
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
