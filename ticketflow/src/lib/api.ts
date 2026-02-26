// ============================================================
// API CLIENT — TicketFlow Integration
// Base URL: VITE_API_URL (via API Gateway porta 8080)
//
// FIX C02:  Login envia companyId no body (não em header)
// FIX H04:  ROLE_CLIENT mapeado corretamente (não aliases como "user")
// FIX H07:  Password reset URLs alinhadas com backend
// FIX M16:  TicketHistory alinhado com DTO backend
// FIX M17:  Campos Ticket alinhados com backend (removido description, createdBy)
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export function getToken(): string | null { return sessionStorage.getItem("tf_token"); }
export function setToken(token: string): void { sessionStorage.setItem("tf_token", token); }
export function removeToken(): void { sessionStorage.removeItem("tf_token"); }

export interface JwtPayload {
  sub: string; companyId: string; name: string; email: string; roles: string[]; exp: number; iat: number;
}

export function decodeJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token JWT inválido");
  const p = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (p.length % 4)) % 4;
  return JSON.parse(atob(p + "=".repeat(padLen)));
}

export function isTokenExpired(token: string): boolean {
  try { const { exp } = decodeJwt(token); return Date.now() >= (exp * 1000) - 60_000; }
  catch { return true; }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    if (isTokenExpired(token)) { removeToken(); window.location.href = "/login"; throw new Error("Sessão expirada."); }
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { removeToken(); window.location.href = "/login"; throw new Error("Sessão expirada."); }
  if (res.status === 403) throw new Error("Acesso negado.");
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) data = await res.json();
  else { const text = await res.text(); data = text || null; }
  if (!res.ok) {
    const msg = (data as Record<string,string>)?.message || (data as Record<string,string>)?.error || `Erro ${res.status}`;
    const err = new Error(msg); (err as Error & {status: number}).status = res.status; throw err;
  }
  return data as T;
}

// ── MAPPERS ───────────────────────────────────────────────────

/**
 * FIX H04: BackendRole agora inclui ROLE_CLIENT.
 * Antes: ROLE_CLIENT era silenciosamente mapeado para "user" sem distinção.
 */
export type BackendRole =
  | "ROLE_USER"
  | "ROLE_CLIENT"
  | "ROLE_SUPPORT"
  | "ROLE_ADMIN"
  | "ROLE_SUPER_ADMIN";

export type FrontendRole = "user" | "client" | "support" | "admin" | "super_admin";

export type BackendArea = "IT" | "HR" | "FINANCE" | "MARKETING" | "SALES" | "OPERATIONS" | "LEGAL" | "PROCUREMENT";
export type FrontendArea = "TI" | "RH" | "Financeiro" | "Marketing" | "Vendas" | "Operações" | "Jurídico" | "Compras";

/**
 * FIX H04: Mapeamento completo e bidirecional — ROLE_CLIENT incluído.
 * Sem alias, sem "user" escondendo CLIENT.
 */
const ROLE_BE_FE: Record<BackendRole, FrontendRole> = {
  ROLE_USER:        "user",
  ROLE_CLIENT:      "client",     // FIX: antes era "user" — agora distinto
  ROLE_SUPPORT:     "support",
  ROLE_ADMIN:       "admin",
  ROLE_SUPER_ADMIN: "super_admin",
};

const ROLE_FE_BE: Record<FrontendRole, BackendRole> = {
  user:        "ROLE_USER",
  client:      "ROLE_CLIENT",   // FIX: antes ausente — não podia enviar ROLE_CLIENT
  support:     "ROLE_SUPPORT",
  admin:       "ROLE_ADMIN",
  super_admin: "ROLE_SUPER_ADMIN",
};

const AREA_BE_FE: Record<BackendArea, FrontendArea> = {
  IT: "TI", HR: "RH", FINANCE: "Financeiro", MARKETING: "Marketing",
  SALES: "Vendas", OPERATIONS: "Operações", LEGAL: "Jurídico", PROCUREMENT: "Compras",
};
const AREA_FE_BE: Record<FrontendArea, BackendArea> = {
  TI: "IT", RH: "HR", Financeiro: "FINANCE", Marketing: "MARKETING",
  Vendas: "SALES", Operações: "OPERATIONS", Jurídico: "LEGAL", Compras: "PROCUREMENT",
};

const STATUS_BE_FE: Record<string, string> = {
  OPEN: "open", IN_PROGRESS: "in_progress", PENDING: "pending",
  AWAITING_USER: "awaiting_user", RESOLVED: "resolved", CANCELLED: "cancelled",
};
const STATUS_FE_BE: Record<string, string> = {
  open: "OPEN", in_progress: "IN_PROGRESS", pending: "PENDING",
  awaiting_user: "AWAITING_USER", resolved: "RESOLVED", cancelled: "CANCELLED",
};

export const PRIORITY_BE_TO_FE: Record<string, string> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical",
};
export const PRIORITY_FE_TO_BE: Record<string, string> = {
  low: "LOW", medium: "MEDIUM", high: "HIGH", critical: "CRITICAL",
};

const FT_BE_FE: Record<string, string> = {
  TEXT: "text", TEXTAREA: "textarea", NUMBER: "number", DATE: "date",
  SELECT: "dropdown", CHECKBOX: "checkbox", RADIO: "dropdown", FILE: "text",
};
const FT_FE_BE: Record<string, string> = {
  text: "TEXT", textarea: "TEXTAREA", number: "NUMBER", email: "TEXT",
  date: "DATE", dropdown: "SELECT", checkbox: "CHECKBOX",
};

export function mapRoleToFrontend(roles: string[]): FrontendRole {
  // Precedência de maior para menor privilégio
  const order: BackendRole[] = [
    "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPPORT", "ROLE_CLIENT", "ROLE_USER",
  ];
  for (const r of order) {
    if (roles.includes(r)) return ROLE_BE_FE[r];
  }
  return "user";
}

export function mapRoleToBackend(role: FrontendRole): BackendRole {
  return ROLE_FE_BE[role];
}

export function mapAreaToFrontend(area: string): FrontendArea {
  return AREA_BE_FE[area as BackendArea] ?? (area as FrontendArea);
}
export function mapAreaToBackend(area: FrontendArea): BackendArea {
  return AREA_FE_BE[area] ?? (area as unknown as BackendArea);
}
export function mapStatusToFrontend(s: string): string { return STATUS_BE_FE[s] ?? s.toLowerCase(); }
export function mapStatusToBackend(s: string): string { return STATUS_FE_BE[s] ?? s.toUpperCase(); }
export function mapFieldTypeToFrontend(t: string): string { return FT_BE_FE[t] ?? "text"; }
export function mapFieldTypeToBackend(t: string): string { return FT_FE_BE[t] ?? "TEXT"; }

export const FRONTEND_AREAS: FrontendArea[] = [
  "TI", "RH", "Financeiro", "Marketing", "Vendas", "Operações", "Jurídico", "Compras",
];

// ── RESPONSE TYPES ────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string; tokenType: string; expiresIn: number; refreshExpiresIn?: number;
  userId: string; companyId: string; name: string; email: string; roles: string[];
}

export interface ApiResponse<T> { success: boolean; message?: string; data: T; }

export interface BackendUser {
  userId: string; companyId: string; name: string; email: string; cpf: string; rg: string;
  birthDate: string; phone: string; area: string; position: string; employment: string;
  roles: BackendRole[]; status: string; createdAt: string; updatedAt: string;
}

export interface BackendCompany {
  companyId: string; nameCompany: string; document: string; emailCompany: string;
  phoneCompany: string; planType: string; companyStatus: string; createdAt: string; updatedAt: string;
}

export interface BackendFormField {
  id: string; label: string; fieldType: string; required: boolean; fieldOrder: number;
  options: string | null;
}

export interface BackendForm {
  id: string; name: string; description: string; areaType: string; version: number;
  active: boolean; createdAt: string; fields: BackendFormField[];
}

/**
 * FIX M16: TicketHistory alinhado com TicketHistoryResponse do backend.
 * Antes: { action, by } — não correspondiam aos campos reais.
 * Agora: { changedById, changedByName, fieldChanged, oldValue, newValue }
 */
export interface BackendTicketHistory {
  id: string;
  changedById: string;
  changedByName: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface BackendTicketFormData {
  id: string;
  fieldLabel: string;
  fieldValue: string;
  fieldOrder: number;
}

/**
 * FIX M17: BackendTicket alinhado com TicketResponse do backend.
 * Removidos: description (não existe no backend), createdBy/createdByRole (eram aliases).
 * Campos corretos: requesterId, requesterName, slaStatus, closedAt.
 */
export interface BackendTicket {
  id: string;
  companyId: string;
  areaType: string;
  formId: string;
  formName: string;
  title: string;
  requesterId: string;
  requesterName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  status: string;
  priority: string;
  slaStatus: string;
  dueAt: string | null;
  formData: BackendTicketFormData[];
  history: BackendTicketHistory[];
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface BackendTicketSummary {
  id: string; title: string; areaType: string; formName: string;
  requesterName: string; assigneeName: string | null;
  status: string; priority: string; slaStatus: string; dueAt: string | null; createdAt: string;
}

export interface PageResponse<T> {
  content: T[]; totalElements: number; totalPages: number; number: number; size: number; last?: boolean;
}

export interface BackendTicketMetrics {
  totalTickets: number; openTickets: number; inProgressTickets: number; pendingTickets: number;
  awaitingUserTickets: number; resolvedTickets: number; cancelledTickets: number;
  unassignedTickets: number;
  ticketsByArea: Record<string, number>; ticketsByPriority: Record<string, number>;
}

export interface BackendComment {
  id: string; ticketId?: string; authorId: string; authorName: string; authorRole: string;
  content: string; internal: boolean; createdAt: string;
}

// ── AUTH ──────────────────────────────────────────────────────

/**
 * FIX C02: Login envia companyId no body JSON.
 * Antes: apenas { email, password } — companyId era ignorado pelo Spring (ficava no body
 *        mas o controller lia de @RequestHeader("X-Company-Id") que nunca era enviado).
 */
export async function login(
  email: string,
  password: string,
  companyId: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, companyId }), // companyId agora no body
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null) as Record<string,string> | null;
    throw new Error(d?.message || `Erro ${res.status}`);
  }
  const data = await res.json() as { data: LoginResponse };
  return data.data;
}

// ── USERS ─────────────────────────────────────────────────────

export interface CreateUserPayload {
  name: string; email: string; password: string; cpf: string; rg: string;
  birthDate: string; phone: string; area: BackendArea; position: string;
  employment: string; roles: BackendRole[];
}

export async function getUsers(page = 0, size = 50): Promise<PageResponse<BackendUser>> {
  return request("GET", `/api/v1/users?page=${page}&size=${size}`);
}
export async function getAssignableUsers(): Promise<BackendUser[]> {
  return request("GET", "/api/v1/users/assignable");
}
export async function createUser(payload: CreateUserPayload): Promise<BackendUser> {
  return request("POST", "/api/v1/users", payload);
}
export async function updateUserName(userId: string, name: string): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/name`, { name });
}
export async function updateUserEmail(userId: string, email: string): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/email`, { email });
}
export async function updateUserStatus(userId: string, status: string): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/status`, { status });
}
/**
 * FIX C03: updateUserPassword agora envia currentPassword para validação server-side.
 * Admin pode omitir currentPassword (reset administrativo).
 */
export async function updateUserPassword(
  userId: string,
  password: string,
  currentPassword?: string
): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/password`, { currentPassword, password });
}
export async function updateUserArea(userId: string, area: BackendArea): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/area`, { area });
}
export async function addUserRole(userId: string, role: BackendRole): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/roles`, { role });
}

// Self-service (próprio perfil)
export async function updateMyName(userId: string, name: string): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/name`, { name });
}
export async function updateMyEmail(userId: string, email: string): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/email`, { email });
}
export async function updateMyPassword(
  userId: string,
  currentPassword: string,
  password: string
): Promise<BackendUser> {
  // FIX C03: self-service SEMPRE envia currentPassword
  return request("PATCH", `/api/v1/users/${userId}/password`, { currentPassword, password });
}
export async function updateMyPhone(userId: string, phone: string): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/phone`, { phone });
}

// ── COMPANIES ─────────────────────────────────────────────────

export interface CreateCompanyPayload {
  nameCompany: string; document: string; emailCompany: string; phoneCompany: string; planType: string;
}
export async function getCompanies(page = 0, size = 50): Promise<PageResponse<BackendCompany>> {
  return request("GET", `/api/v1/companies?page=${page}&size=${size}`);
}
export async function getCompany(companyId: string): Promise<BackendCompany> {
  return request("GET", `/api/v1/companies/${companyId}`);
}
export async function createCompany(payload: CreateCompanyPayload): Promise<BackendCompany> {
  return request("POST", "/api/v1/companies", payload);
}
export async function updateCompanyName(companyId: string, nameCompany: string): Promise<BackendCompany> {
  return request("PATCH", `/api/v1/companies/${companyId}/name`, { nameCompany });
}
export async function updateCompanyStatus(companyId: string, companyStatus: string): Promise<BackendCompany> {
  return request("PATCH", `/api/v1/companies/${companyId}/status`, { companyStatus });
}
export async function updateCompanyPlan(companyId: string, planType: string): Promise<BackendCompany> {
  return request("PATCH", `/api/v1/companies/${companyId}/plan`, { planType });
}
export async function updateCompanyDocument(companyId: string, document: string): Promise<BackendCompany> {
  return request("PATCH", `/api/v1/companies/${companyId}/document`, { document });
}
export async function updateCompanyEmail(companyId: string, emailCompany: string): Promise<BackendCompany> {
  return request("PATCH", `/api/v1/companies/${companyId}/email`, { emailCompany });
}
export async function updateCompanyPhone(companyId: string, phoneCompany: string): Promise<BackendCompany> {
  return request("PATCH", `/api/v1/companies/${companyId}/phone`, { phoneCompany });
}

// ── FORMS ─────────────────────────────────────────────────────

export async function getActiveForms(): Promise<BackendForm[]> {
  const r = await request<ApiResponse<BackendForm[]>>("GET", "/api/v1/forms/active"); return r.data;
}
export async function getAllForms(): Promise<BackendForm[]> {
  const r = await request<ApiResponse<BackendForm[]>>("GET", "/api/v1/forms"); return r.data;
}
export async function getFormsByArea(area: BackendArea): Promise<BackendForm[]> {
  const r = await request<ApiResponse<BackendForm[]>>("GET", `/api/v1/forms/area/${area}`); return r.data;
}
export async function getFormById(id: string): Promise<BackendForm> {
  const r = await request<ApiResponse<BackendForm>>("GET", `/api/v1/forms/${id}`); return r.data;
}

export interface CreateFormPayload {
  name: string; description: string; areaType: BackendArea;
  fields: Array<{ label: string; fieldType: string; required: boolean; fieldOrder: number; options?: string }>;
}
export async function createForm(payload: CreateFormPayload): Promise<BackendForm> {
  const r = await request<ApiResponse<BackendForm>>("POST", "/api/v1/forms", payload); return r.data;
}
export async function updateForm(id: string, payload: CreateFormPayload): Promise<BackendForm> {
  const r = await request<ApiResponse<BackendForm>>("PUT", `/api/v1/forms/${id}`, payload); return r.data;
}
export async function toggleFormActive(id: string): Promise<BackendForm> {
  const r = await request<ApiResponse<BackendForm>>("PATCH", `/api/v1/forms/${id}/toggle-active`); return r.data;
}
export async function deleteForm(id: string): Promise<void> {
  return request("DELETE", `/api/v1/forms/${id}`);
}

// ── TICKETS ───────────────────────────────────────────────────

export interface CreateTicketPayload {
  formId: string; title: string; areaType: BackendArea; priority: string;
  formData: Array<{ fieldLabel: string; fieldValue: string; fieldOrder: number }>;
}

export async function getTickets(page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets?page=${page}&size=${size}`);
}
export async function getMyTickets(page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets/my?page=${page}&size=${size}`);
}
export async function getTicketsByStatus(status: string, page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets/status/${status}?page=${page}&size=${size}`);
}
export async function getTicketsByPriority(priority: string, page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets/priority/${priority}?page=${page}&size=${size}`);
}
export async function getUnassignedTickets(page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets/unassigned?page=${page}&size=${size}`);
}
export async function getSlaBreachedTickets(page = 0, size = 100): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets/sla/breached?page=${page}&size=${size}`);
}
export async function searchTickets(q: string, page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`);
}
export async function getTicketById(id: string): Promise<BackendTicket> {
  const r = await request<ApiResponse<BackendTicket>>("GET", `/api/v1/tickets/${id}`); return r.data;
}
export async function getTicketMetrics(): Promise<BackendTicketMetrics> {
  const r = await request<ApiResponse<BackendTicketMetrics>>("GET", "/api/v1/tickets/metrics"); return r.data;
}
export async function createTicket(payload: CreateTicketPayload): Promise<BackendTicket> {
  const r = await request<ApiResponse<BackendTicket>>("POST", "/api/v1/tickets", payload); return r.data;
}
export async function updateTicketStatus(ticketId: string, status: string): Promise<BackendTicket> {
  const r = await request<ApiResponse<BackendTicket>>("PATCH", `/api/v1/tickets/${ticketId}/status`, { status });
  return r.data;
}
export async function assignTicket(
  ticketId: string, assigneeId: string, assigneeName: string
): Promise<BackendTicket> {
  const r = await request<ApiResponse<BackendTicket>>("PATCH", `/api/v1/tickets/${ticketId}/assign`, {
    assigneeId, assigneeName,
  });
  return r.data;
}

// ── COMMENTS ──────────────────────────────────────────────────

export async function getComments(ticketId: string): Promise<BackendComment[]> {
  return request("GET", `/api/v1/tickets/${ticketId}/comments`);
}
export async function addComment(ticketId: string, content: string, internal = false): Promise<BackendComment> {
  const r = await request<ApiResponse<BackendComment>>("POST", `/api/v1/tickets/${ticketId}/comments`, {
    content, internal,
  });
  return r.data;
}

// ── PASSWORD RECOVERY ─────────────────────────────────────────

/**
 * FIX H07: URLs alinhadas com o backend real.
 *
 * Antes (ERRADO — não existia no auth-service):
 *   POST /api/v1/auth/forgot-password
 *   POST /api/v1/auth/reset-password
 *
 * Agora (CORRETO — user-service):
 *   POST /api/v1/users/password-reset/request
 *   POST /api/v1/users/password-reset/confirm
 *
 * Nota: password-reset/request requer X-Company-Id header (backend existente).
 */
export async function forgotPassword(email: string, companyId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/users/password-reset/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Id": companyId,  // requerido pelo user-service para escopo de tenant
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null) as Record<string,string> | null;
    throw new Error(d?.message || `Erro ${res.status}`);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/users/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null) as Record<string,string> | null;
    throw new Error(d?.message || `Erro ${res.status}`);
  }
}

// ── EXPORT CSV ────────────────────────────────────────────────

export async function exportTicketsCsv(): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Não autenticado.");
  const res = await fetch(`${API_URL}/api/v1/tickets/export/csv`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erro ao exportar: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}