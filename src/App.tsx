import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AuthContainer } from "./components/AuthContainer";
import Index from "./pages/Index";
import UserManagement from "./pages/UserManagement";
import DoorDash from "./pages/DoorDash";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedApp = () => {
  const { user, userRole, userPreferences, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Default to bills enabled if preferences don't exist yet
  const billsEnabled = userPreferences?.bills_enabled ?? true;
  const doordashEnabled = userPreferences?.doordash_enabled ?? false;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        {user ? (
          <>
            <Route path="/settings" element={<Settings />} />
            
            {billsEnabled && (
              <Route path="/" element={<Index />} />
            )}
            
            {doordashEnabled && (
              <Route path="/doordash" element={<DoorDash />} />
            )}
            
            {userRole === 'admin' && <Route path="/users" element={<UserManagement />} />}
            
            {!billsEnabled && !doordashEnabled && (
              <Route path="/" element={<Navigate to="/settings" replace />} />
            )}
          </>
        ) : (
          <Route path="/" element={<AuthContainer />} />
        )}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
