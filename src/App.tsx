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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <AddOnProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/performance" element={<PerformanceDashboard />} />
              <Route path="/performance/calendar" element={<TeamCalendar />} />
              <Route path="/performance/:name" element={<SalespersonDetails />} />
              <Route path="/incentives" element={<IncentivesDashboard />} />
              <Route path="/settings/follow-up-policy" element={<FollowUpPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AddOnProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
