import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Suites from "./pages/Suites";
import TestCases from "./pages/TestCases";
import Runs from "./pages/Runs";
import RunDetail from "./pages/RunDetail";
import RunCanvas from "./pages/RunCanvas";
import Sources from "./pages/Sources";
import Environments from "./pages/Environments";
import Integrations from "./pages/Integrations";
import Deployments from "./pages/Deployments";
import DeploymentDetail from "./pages/DeploymentDetail";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import MagicLink from "./pages/MagicLink";
import AuthCallback from "./pages/AuthCallback";
import Schedules from "./pages/Schedules";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <KeyboardShortcutsProvider>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/chat/:conversationId" element={<Index />} />
                <Route path="/suites" element={<Suites />} />
                <Route path="/suites/:suiteId" element={<Suites />} />
                <Route path="/suites/:suiteId/runs" element={<Runs />} />
                <Route path="/suites/:suiteId/runs/:runId" element={<RunDetail />} />
                <Route path="/suites/:suiteId/runs/:runId/canvas" element={<RunCanvas />} />
                <Route path="/test-cases" element={<TestCases />} />
                <Route path="/test-cases/:caseId" element={<TestCases />} />
                <Route path="/runs" element={<Runs />} />
                <Route path="/runs/:runId" element={<RunDetail />} />
                <Route path="/runs/:runId/canvas" element={<RunCanvas />} />
                <Route path="/schedules" element={<Schedules />} />
                <Route path="/schedules/:scheduleId" element={<Schedules />} />
                <Route path="/sources" element={<Sources />} />
                <Route path="/environments" element={<Environments />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/deployments" element={<Deployments />} />
                <Route path="/deployments/:deployId" element={<DeploymentDetail />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/magic-link" element={<MagicLink />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </KeyboardShortcutsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
