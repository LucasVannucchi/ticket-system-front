// ============================================================
// DOMAIN TYPES — TicketFlow
//
// FIX H04:  Role inclui "client" como tipo distinto (não alias de "user")
// FIX M16:  TicketHistory alinhado com TicketHistoryResponse do backend
// FIX M17:  Ticket sem description/createdBy — alinhado com TicketResponse backend
// ============================================================

export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "open" | "in_progress" | "pending" | "awaiting_user" | "resolved" | "cancelled";

/**
 * FIX H04: "client" agora é role distinto.
 * Antes: ROLE_CLIENT → "user" (indistinguível de ROLE_USER, sem distinção visual ou funcional)
 * Agora: ROLE_CLIENT → "client" (mapeamento correto, exibição e lógica distintas)
 */
export type Role = "user" | "client" | "support" | "admin" | "super_admin";

export type Area =
  | "TI" | "RH" | "Financeiro" | "Marketing"
  | "Vendas" | "Operações" | "Jurídico" | "Compras";

export const ALL_AREAS: Area[] = [
  "TI", "RH", "Financeiro", "Marketing", "Vendas", "Operações", "Jurídico", "Compras",
];

export interface Company {
  id: string;
  name: string;
  slug?: string;
  planType: string;
  status: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;           // FIX M17: campo real do backend
  author: string;             // alias de authorName para UI
  authorRole: string;         // role bruta (ROLE_SUPPORT, etc.) vinda do backend
  content: string;
  createdAt: string;
  internal?: boolean;
}

/**
 * FIX M16: TicketHistory alinhado com TicketHistoryResponse do backend.
 *
 * Antes (ERRADO — campos inexistentes no backend):
 *   { action: string; by: string; createdAt: string }
 *
 * Agora (CORRETO — corresponde ao TicketHistoryResponse):
 *   { changedById, changedByName, fieldChanged, oldValue, newValue, createdAt }
 */
export interface TicketHistory {
  id: string;
  changedById: string;
  changedByName: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface TicketFormData {
  id: string;
  fieldLabel: string;
  fieldValue: string;
  fieldOrder: number;
}

export type SlaStatus = "OK" | "AT_RISK" | "BREACHED" | "NOT_APPLICABLE";

/**
 * FIX M17: Ticket alinhado com TicketResponse do backend.
 *
 * Removidos (não existem no backend):
 *   - description: string
 *   - createdBy: string  (era alias de requesterName)
 *   - createdByRole: Role (não existe no TicketResponse)
 *   - updatedAt: string  (não existe no TicketResponse)
 *   - category: string   (não existe no TicketResponse — use formName)
 *
 * Corrigidos:
 *   - comments removido do Ticket (são carregados separadamente via GET /comments)
 *   - history agora tipado corretamente com TicketHistory
 *   - areaType adicionado (campo real do backend)
 */
export interface Ticket {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  requesterId: string;
  requesterName: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  formData: TicketFormData[];
  history: TicketHistory[];
  area: Area;          // mapped from areaType
  areaType?: string;   // raw backend value (IT, HR, etc.)
  companyId: string;
  formId?: string;
  formName?: string;
  slaStatus?: SlaStatus;
  dueAt?: string | null;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "email" | "dropdown" | "checkbox" | "date" | "textarea";
  required: boolean;
  options?: string[];
  fieldOrder: number;
}

export interface CustomForm {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  area: Area;
  companyId: string;
  active?: boolean;
  version?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles: string[];   // roles brutas do backend (ROLE_USER, etc.)
  area: Area;
  companyId: string;
  createdAt: string;
  status?: string;
  position?: string;
  employment?: string;
}

// ── Config Objects for UI ──────────────────────────────────────

export const statusConfig: Record<Status, { label: string; class: string }> = {
  open:          { label: "Aberto",             class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress:   { label: "Em Andamento",       class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  pending:       { label: "Pendente",           class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  awaiting_user: { label: "Aguardando Usuário", class: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  resolved:      { label: "Resolvido",          class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled:     { label: "Cancelado",          class: "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400" },
};

export const priorityConfig: Record<Priority, { label: string; class: string }> = {
  low:      { label: "Baixa",   class: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400" },
  medium:   { label: "Média",   class: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  high:     { label: "Alta",    class: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  critical: { label: "Crítica", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

/**
 * FIX H04: roleConfig inclui "client" como entrada distinta.
 * Antes: "client" estava no type mas sem entrada no Record — causa crash em runtime.
 */
export const roleConfig: Record<Role, { label: string; class: string }> = {
  user:        { label: "Usuário",     class: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" },
  client:      { label: "Cliente",     class: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
  support:     { label: "Suporte",     class: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  admin:       { label: "Admin",       class: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  super_admin: { label: "Super Admin", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export const slaStatusConfig: Record<SlaStatus, { label: string; class: string }> = {
  OK:             { label: "OK",         class: "bg-green-100 text-green-700" },
  AT_RISK:        { label: "Em Risco",   class: "bg-yellow-100 text-yellow-700" },
  BREACHED:       { label: "Violado",    class: "bg-red-100 text-red-700" },
  NOT_APPLICABLE: { label: "N/A",        class: "bg-gray-100 text-gray-500" },
};