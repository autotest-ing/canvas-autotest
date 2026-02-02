import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import Index from "./pages/Index";
import Suites from "./pages/Suites";
import Runs from "./pages/Runs";
import Sources from "./pages/Sources";
import Environments from "./pages/Environments";
import Integrations from "./pages/Integrations";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
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
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/suites" element={<Suites />} />
              <Route path="/runs" element={<Runs />} />
              <Route path="/sources" element={<Sources />} />
              <Route path="/environments" element={<Environments />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </KeyboardShortcutsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
