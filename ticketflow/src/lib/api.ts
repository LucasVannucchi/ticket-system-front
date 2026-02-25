// ============================================================
// API CLIENT — TicketFlow Integration
// Base URL: VITE_API_URL (via API Gateway na porta 8080)
//
// CORREÇÕES APLICADAS:
//  [C01] LoginResponse.accessToken corrigido (era "token")
//  [A03] addComment agora envia campo "internal"
//  [A04] ROLE_CLIENT adicionado ao mapa de roles
//  [C04] Todos os 8 AreaTypes do backend mapeados
//  [A02] Utilitário isTokenExpired() exportado
//  [B03] Tratamento de 403 adicionado
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// ── Token helpers ─────────────────────────────────────────────
// Armazena em sessionStorage (fechou a aba → sessão encerrada)
// Para máxima segurança use httpOnly cookies (requer mudança no backend)
export function getToken(): string | null {
  return sessionStorage.getItem("tf_token");
}
export function setToken(token: string): void {
  sessionStorage.setItem("tf_token", token);
}
export function removeToken(): void {
  sessionStorage.removeItem("tf_token");
}

// ── JWT decode (sem biblioteca externa) ──────────────────────
export interface JwtPayload {
  sub: string;       // userId
  companyId: string;
  name: string;
  email: string;
  roles: string[];
  exp: number;       // expiração em segundos Unix
  iat: number;
}

export function decodeJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token JWT inválido");
  const payload = parts[1];
  // Padding necessário para base64url
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return JSON.parse(atob(padded + "=".repeat(padLen)));
}

/** Retorna true se o token estiver expirado ou a menos de 60s do expirar */
export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = decodeJwt(token);
    return Date.now() >= (exp * 1000) - 60_000; // 60s de buffer
  } catch {
    return true;
  }
}

// ── HTTP wrapper ──────────────────────────────────────────────
async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    if (isTokenExpired(token)) {
      removeToken();
      window.location.href = "/login";
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    headers["Authorization"] = `Bearer ${token}`;

    // 🔥 ADIÇÃO IMPORTANTE: envia o tenant automaticamente
    try {
      const { companyId } = decodeJwt(token);
      if (companyId) {
        headers["X-Company-Id"] = companyId;
      }
    } catch {
      removeToken();
      window.location.href = "/login";
      throw new Error("Token inválido. Faça login novamente.");
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 → logout automático
  if (res.status === 401) {
    removeToken();
    window.location.href = "/login";
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  // 403 → acesso negado
  if (res.status === 403) {
    throw new Error("Acesso negado. Você não tem permissão para esta ação.");
  }

  // 204 → sem conteúdo
  if (res.status === 204) {
    return undefined as T;
  }

  let data: any = null;
  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = text ? text : null;
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Erro ${res.status}`;

    const err = new Error(msg);
    (err as any).errorCode = data?.errorCode;
    (err as any).errors = data?.errors;
    (err as any).status = res.status;
    throw err;
  }

  return data as T;
}

// ============================================================
// MAPPERS  (Frontend ↔ Backend)
// ============================================================

export type BackendRole =
  | "ROLE_USER"
  | "ROLE_CLIENT"     // [A04] adicionado
  | "ROLE_SUPPORT"
  | "ROLE_ADMIN"
  | "ROLE_SUPER_ADMIN";

export type FrontendRole = "user" | "client" | "support" | "admin" | "super_admin";

// [C04] Todos os 8 AreaTypes do backend mapeados
export type BackendArea =
  | "IT"
  | "HR"
  | "FINANCE"
  | "MARKETING"
  | "SALES"
  | "OPERATIONS"
  | "LEGAL"
  | "PROCUREMENT";

export type FrontendArea =
  | "TI"
  | "RH"
  | "Financeiro"
  | "Marketing"
  | "Vendas"
  | "Operações"
  | "Jurídico"
  | "Compras";

// [A04] ROLE_CLIENT adicionado
const ROLE_BE_TO_FE: Record<BackendRole, FrontendRole> = {
  ROLE_USER: "user",
  ROLE_CLIENT: "client",
  ROLE_SUPPORT: "support",
  ROLE_ADMIN: "admin",
  ROLE_SUPER_ADMIN: "super_admin",
};

const ROLE_FE_TO_BE: Record<FrontendRole, BackendRole> = {
  user: "ROLE_USER",
  client: "ROLE_CLIENT",
  support: "ROLE_SUPPORT",
  admin: "ROLE_ADMIN",
  super_admin: "ROLE_SUPER_ADMIN",
};

// [C04] Todos os 8 AreaTypes
const AREA_BE_TO_FE: Record<BackendArea, FrontendArea> = {
  IT: "TI",
  HR: "RH",
  FINANCE: "Financeiro",
  MARKETING: "Marketing",
  SALES: "Vendas",
  OPERATIONS: "Operações",
  LEGAL: "Jurídico",
  PROCUREMENT: "Compras",
};

const AREA_FE_TO_BE: Record<FrontendArea, BackendArea> = {
  TI: "IT",
  RH: "HR",
  Financeiro: "FINANCE",
  Marketing: "MARKETING",
  Vendas: "SALES",
  Operações: "OPERATIONS",
  Jurídico: "LEGAL",
  Compras: "PROCUREMENT",
};

const STATUS_BE_TO_FE: Record<string, string> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  PENDING: "pending",
  AWAITING_USER: "awaiting_user",
  RESOLVED: "resolved",
  CANCELLED: "cancelled",
};

const STATUS_FE_TO_BE: Record<string, string> = {
  open: "OPEN",
  in_progress: "IN_PROGRESS",
  pending: "PENDING",
  awaiting_user: "AWAITING_USER",
  resolved: "RESOLVED",
  cancelled: "CANCELLED",
};

export const PRIORITY_BE_TO_FE: Record<string, string> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const PRIORITY_FE_TO_BE: Record<string, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

const FIELD_TYPE_BE_TO_FE: Record<string, string> = {
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  DATE: "date",
  SELECT: "dropdown",
  CHECKBOX: "checkbox",
  RADIO: "dropdown",
  FILE: "text",
};

const FIELD_TYPE_FE_TO_BE: Record<string, string> = {
  text: "TEXT",
  textarea: "TEXTAREA",
  number: "NUMBER",
  email: "TEXT",
  date: "DATE",
  dropdown: "SELECT",
  checkbox: "CHECKBOX",
};

export function mapRoleToFrontend(roles: string[]): FrontendRole {
  const priority: BackendRole[] = [
    "ROLE_SUPER_ADMIN",
    "ROLE_ADMIN",
    "ROLE_SUPPORT",
    "ROLE_CLIENT",
    "ROLE_USER",
  ];
  for (const p of priority) {
    if (roles.includes(p)) return ROLE_BE_TO_FE[p];
  }
  return "user";
}

export function mapRoleToBackend(role: FrontendRole): BackendRole {
  return ROLE_FE_TO_BE[role];
}

export function mapAreaToFrontend(area: string): FrontendArea {
  return AREA_BE_TO_FE[area as BackendArea] ?? (area as FrontendArea);
}

export function mapAreaToBackend(area: FrontendArea): BackendArea {
  return AREA_FE_TO_BE[area] ?? (area as unknown as BackendArea);
}

export function mapStatusToFrontend(s: string): string {
  return STATUS_BE_TO_FE[s] ?? s.toLowerCase();
}

export function mapStatusToBackend(s: string): string {
  return STATUS_FE_TO_BE[s] ?? s.toUpperCase();
}

export function mapFieldTypeToFrontend(t: string): string {
  return FIELD_TYPE_BE_TO_FE[t] ?? "text";
}

export function mapFieldTypeToBackend(t: string): string {
  return FIELD_TYPE_FE_TO_BE[t] ?? "TEXT";
}

// Lista de áreas disponíveis no frontend (para selects)
export const FRONTEND_AREAS: FrontendArea[] = [
  "TI", "RH", "Financeiro", "Marketing", "Vendas", "Operações", "Jurídico", "Compras"
];

// ============================================================
// BACKEND RESPONSE TYPES
// ============================================================

// [C01] CORREÇÃO CRÍTICA: campo era "token", deve ser "accessToken"
export interface LoginResponse {
  accessToken: string;  // ← CORRIGIDO (antes era "token")
  tokenType: string;
  expiresIn: number;
  userId: string;
  companyId: string;
  name: string;
  email: string;
  roles: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errorCode?: string;
  errors?: string[];
}

export interface BackendUser {
  userId: string;
  companyId: string;
  name: string;
  email: string;
  cpf: string;
  rg: string;
  birthDate: string;
  phone: string;
  area: string;
  position: string;
  employment: string;
  roles: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendCompany {
  companyId: string;
  nameCompany: string;
  document: string;
  emailCompany: string;
  phoneCompany: string;
  planType: string;
  companyStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendFormField {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
  fieldOrder: number;
  options: string | null;
}

export interface BackendForm {
  id: string;
  name: string;
  description: string;
  areaType: string;
  version: number;
  active: boolean;
  createdAt: string;
  fields: BackendFormField[];
}

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
  formData: Array<{ fieldLabel: string; fieldValue: string; fieldOrder: number }>;
  history: Array<{ id: string; action: string; changedBy: string; createdAt: string }>;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface BackendTicketSummary {
  id: string;
  title: string;
  areaType: string;
  formName: string;
  requesterName: string;
  assigneeName: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface BackendTicketMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  pendingTickets: number;
  awaitingUserTickets: number;
  resolvedTickets: number;
  cancelledTickets: number;
  unassignedTickets: number;
  ticketsByArea: Record<string, number>;
  ticketsByPriority: Record<string, number>;
}

// ============================================================
// AUTH
// ============================================================

export async function login(
  email: string,
  password: string,
  companyId: string
): Promise<LoginResponse> {

  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Id": companyId, // 🔥 ENVIA O TENANT NO LOGIN
    },
    body: JSON.stringify({
      email,
      password,
      companyId,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const msg = data?.message || `Erro ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.data; // porque o backend retorna ApiResponse<LoginResponse>
}

// ============================================================
// USERS
// ============================================================

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  cpf: string;
  rg: string;
  birthDate: string;  // ISO date: "YYYY-MM-DD"
  phone: string;      // 11 dígitos
  area: BackendArea;
  position: string;   // PositionType enum
  employment: string; // EmploymentType enum
  roles: BackendRole[];
}

// UserController retorna ResponseEntity<Page<UserResponse>> direto (sem ApiResponse wrapper)
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

export async function updateUserPassword(userId: string, password: string): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/password`, { password });
}

export async function addUserRole(userId: string, role: BackendRole): Promise<BackendUser> {
  return request("PATCH", `/api/v1/users/${userId}/roles`, { role });
}

// ============================================================
// COMPANIES
// ============================================================

export interface CreateCompanyPayload {
  nameCompany: string;
  document: string;     // CNPJ (14 dígitos sem formatação)
  emailCompany: string;
  phoneCompany: string; // 11 dígitos
  planType: string;     // PlanType enum: BASIC | STANDARD | PREMIUM
}

// CompanyController retorna CompanyResponse direto (sem ApiResponse wrapper)
export async function getCompany(companyId: string): Promise<BackendCompany> {
  return request("GET", `/api/v1/companies/${companyId}`);
}

export async function createCompany(payload: CreateCompanyPayload): Promise<BackendCompany> {
  return request("POST", "/api/v1/companies", payload);
}

// ============================================================
// FORMS
// ============================================================

// FormController retorna ApiResponse<T> — desestrutura .data
export async function getActiveForms(): Promise<BackendForm[]> {
  const res = await request<ApiResponse<BackendForm[]>>("GET", "/api/v1/forms/active");
  return res.data;
}

export async function getAllForms(): Promise<BackendForm[]> {
  const res = await request<ApiResponse<BackendForm[]>>("GET", "/api/v1/forms");
  return res.data;
}

export async function getFormsByArea(area: BackendArea): Promise<BackendForm[]> {
  const res = await request<ApiResponse<BackendForm[]>>("GET", `/api/v1/forms/area/${area}`);
  return res.data;
}

export async function getFormById(id: string): Promise<BackendForm> {
  const res = await request<ApiResponse<BackendForm>>("GET", `/api/v1/forms/${id}`);
  return res.data;
}

export interface CreateFormPayload {
  name: string;
  description: string;
  areaType: BackendArea;
  fields: Array<{
    label: string;
    fieldType: string;  // FieldType enum: TEXT|TEXTAREA|NUMBER|DATE|SELECT|CHECKBOX|RADIO|FILE
    required: boolean;
    fieldOrder: number;
    options?: string;   // CSV para SELECT/RADIO: "Opção A,Opção B,Opção C"
  }>;
}

export async function createForm(payload: CreateFormPayload): Promise<BackendForm> {
  const res = await request<ApiResponse<BackendForm>>("POST", "/api/v1/forms", payload);
  return res.data;
}

export async function updateForm(id: string, payload: CreateFormPayload): Promise<BackendForm> {
  const res = await request<ApiResponse<BackendForm>>("PUT", `/api/v1/forms/${id}`, payload);
  return res.data;
}

export async function toggleFormActive(id: string): Promise<BackendForm> {
  const res = await request<ApiResponse<BackendForm>>("PATCH", `/api/v1/forms/${id}/toggle-active`);
  return res.data;
}

export async function deleteForm(id: string): Promise<void> {
  return request("DELETE", `/api/v1/forms/${id}`);
}

// ============================================================
// TICKETS
// ============================================================

export interface CreateTicketPayload {
  formId: string;
  title: string;
  areaType: BackendArea;
  priority: string;  // Priority enum: LOW|MEDIUM|HIGH|CRITICAL
  formData: Array<{
    fieldLabel: string;
    fieldValue: string;
    fieldOrder: number;
  }>;
}

// TicketController retorna Page<TicketSummaryResponse> direto
export async function getTickets(page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets?page=${page}&size=${size}`);
}

// Endpoint específico para ROLE_USER — somente tickets do próprio usuário
export async function getMyTickets(page = 0, size = 50): Promise<PageResponse<BackendTicketSummary>> {
  return request("GET", `/api/v1/tickets/my?page=${page}&size=${size}`);
}

// TicketController retorna ApiResponse<TicketResponse> — desestrutura .data
export async function getTicketById(id: string): Promise<BackendTicket> {
  const res = await request<ApiResponse<BackendTicket>>("GET", `/api/v1/tickets/${id}`);
  return res.data;
}

export async function getTicketMetrics(): Promise<BackendTicketMetrics> {
  const res = await request<ApiResponse<BackendTicketMetrics>>("GET", "/api/v1/tickets/metrics");
  return res.data;
}

export async function createTicket(payload: CreateTicketPayload): Promise<BackendTicket> {
  const res = await request<ApiResponse<BackendTicket>>("POST", "/api/v1/tickets", payload);
  return res.data;
}

export async function updateTicketStatus(
  ticketId: string,
  status: string  // TicketStatus enum: OPEN|IN_PROGRESS|PENDING|AWAITING_USER|RESOLVED|CANCELLED
): Promise<BackendTicket> {
  const res = await request<ApiResponse<BackendTicket>>(
    "PATCH",
    `/api/v1/tickets/${ticketId}/status`,
    { status }
  );
  return res.data;
}

export async function assignTicket(
  ticketId: string,
  assigneeId: string,
  assigneeName: string
): Promise<BackendTicket> {
  const res = await request<ApiResponse<BackendTicket>>(
    "PATCH",
    `/api/v1/tickets/${ticketId}/assign`,
    { assigneeId, assigneeName }
  );
  return res.data;
}

// ============================================================
// COMMENTS
// ============================================================

export interface BackendComment {
  id: string;
  ticketId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
  internal?: boolean;
}

// CommentController retorna List<CommentResponse> direto
export async function getComments(ticketId: string): Promise<BackendComment[]> {
  return request("GET", `/api/v1/tickets/${ticketId}/comments`);
}

// [A03] CORREÇÃO: campo "internal" adicionado ao body
export async function addComment(
  ticketId: string,
  content: string,
  internal = false  // false = público, true = apenas para suporte
): Promise<BackendComment> {
  const res = await request<ApiResponse<BackendComment>>(
    "POST",
    `/api/v1/tickets/${ticketId}/comments`,
    { content, internal }
  );
  return res.data;
}
