import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import EvaluationForm from "./pages/EvaluationForm";
import EvaluationsListPage from "./pages/EvaluationsListPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import ResultsPage from "./pages/ResultsPage";
import UsersPage from "./pages/UsersPage";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && role !== "admin") return <Navigate to="/evaluations" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={role === "admin" ? "/dashboard" : "/evaluations"} replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? (role === "admin" ? "/dashboard" : "/evaluations") : "/login"} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="/evaluations" element={<ProtectedRoute><EvaluationsListPage /></ProtectedRoute>} />
      <Route path="/evaluations/new" element={<ProtectedRoute><EvaluationForm /></ProtectedRoute>} />
      <Route path="/evaluations/:id/edit" element={<ProtectedRoute><EvaluationForm /></ProtectedRoute>} />
      <Route path="/organizations" element={<ProtectedRoute adminOnly><OrganizationsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
