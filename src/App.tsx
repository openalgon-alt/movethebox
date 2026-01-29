import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { UserProvider } from "./components/auth/UserContext";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import { AddOnProvider } from "./components/settings/AddOnContext";

import SalespersonDetails from "./pages/SalespersonDetails";
import TeamCalendar from "./pages/TeamCalendar";
import IncentivesDashboard from "./pages/IncentivesDashboard";
import FollowUpPolicy from "./pages/FollowUpPolicy";

const queryClient = new QueryClient();

import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "./components/auth/UserContext";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import RoleBasedRedirect from "./components/auth/RoleBasedRedirect";

const ProtectedRoute = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/sales-dashboard" element={<SalesDashboard />} />
        <Route path="/performance" element={<PerformanceDashboard />} />
        <Route path="/performance/calendar" element={<TeamCalendar />} />
        <Route path="/performance/:name" element={<SalespersonDetails />} />
        <Route path="/incentives" element={<IncentivesDashboard />} />
        <Route path="/settings/follow-up-policy" element={<FollowUpPolicy />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <AddOnProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AddOnProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
