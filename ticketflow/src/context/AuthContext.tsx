// ============================================================
// AuthContext — Responsabilidade única: autenticação e sessão
//
// MELHORIAS ENTERPRISE:
//  [A02] Verificação de expiração do token na inicialização
//  [C01] Usa o campo correto "accessToken" da resposta
//  [A05] Responsabilidade separada do AppContext (SRP)
//  Segurança: sessionStorage em vez de localStorage
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import * as api from "@/lib/api";
import {
  setToken,
  removeToken,
  getToken,
  decodeJwt,
  isTokenExpired,
  mapRoleToFrontend,
} from "@/lib/api";
import type { Role } from "@/types/domain";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  companyId: string;
  roles: string[];
  role: Role;       // role de maior privilégio (para uso na UI)
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isInitializing: boolean;
  login: (email: string, password: string, companyId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Tempo em ms para verificar expiração em background (a cada 5min)
const TOKEN_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function buildUserFromPayload(payload: api.JwtPayload): AuthUser {
  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    companyId: payload.companyId,
    roles: payload.roles,
    role: mapRoleToFrontend(payload.roles),
  };
}

function tryRestoreSession(): AuthUser | null {
  const token = getToken();
  if (!token) return null;

  // [A02] Verificação de expiração na inicialização
  if (isTokenExpired(token)) {
    removeToken();
    return null;
  }

  try {
    return buildUserFromPayload(decodeJwt(token));
  } catch {
    removeToken();
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restaura sessão na montagem
  useEffect(() => {
    const restored = tryRestoreSession();
    setUser(restored);
    setIsInitializing(false);
  }, []);

  // Verificação periódica de expiração em background
  useEffect(() => {
    if (!user) return;

    timerRef.current = setInterval(() => {
      const token = getToken();
      if (!token || isTokenExpired(token)) {
        logout();
      }
    }, TOKEN_CHECK_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  const login = useCallback(async (
    email: string,
    password: string,
    companyId: string
  ): Promise<void> => {
    // [C01] api.login() retorna LoginResponse com campo "accessToken"
    const res = await api.login(email, password, companyId);

    // Guarda o token na sessão
    setToken(res.accessToken);

    // Constrói o user a partir do token decodificado para consistência
    const payload = decodeJwt(res.accessToken);
    setUser(buildUserFromPayload(payload));
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, isInitializing, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
