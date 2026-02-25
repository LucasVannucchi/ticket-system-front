// ============================================================
// useCurrentUser — Hook para acesso à sessão atual
//
// Centraliza a lógica de verificação de roles, evitando
// que componentes precisem importar useAuth diretamente.
// ============================================================

import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/domain";

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();

  const role: Role = user?.role ?? "user";

  const isPrivileged = role === "admin" || role === "super_admin" || role === "support";
  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  const isSupport = role === "support" || isAdmin;

  return {
    user,
    isAuthenticated,
    role,
    isPrivileged,
    isAdmin,
    isSuperAdmin,
    isSupport,
    /** Verifica se o usuário tem pelo menos uma das roles fornecidas */
    hasRole: (...roles: Role[]) => roles.includes(role),
  };
}
