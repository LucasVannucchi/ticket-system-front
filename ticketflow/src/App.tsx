// ============================================================
// App.tsx — Ponto de entrada da aplicação
//
// MELHORIAS:
//  AuthProvider envolve AppProvider (dependência respeitada)
//  ProtectedRoutes usa useAuth() em vez do AppContext
//  Loading durante inicialização da sessão (evita flash)
//  Rotas de recuperação de senha adicionadas
//  Proteção de rota /forms para ROLE_USER
// ============================================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import TicketsPage from "./pages/TicketsPage";
import NewTicketPage from "./pages/NewTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import FormsPage from "./pages/FormsPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UserManagementPage from "./pages/UserManagementPage";
import CompaniesPage from "./pages/CompaniesPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Tela de loading global (durante restauração de sessão)
function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Iniciando sessão...</p>
      </div>
    </div>
  );
}

// Rotas protegidas — requer autenticação
function ProtectedRoutes() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <GlobalLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    // AppProvider só monta quando autenticado — evita requests não autorizados
    <AppProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          {/* FormsPage cuida das próprias permissões internamente */}
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
