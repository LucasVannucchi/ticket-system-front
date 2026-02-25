// ============================================================
// DOMAIN TYPES — TicketFlow
//
// MELHORIA: Tipos de domínio separados dos mock data.
// mock-data.ts deve ser usado apenas em testes/dev.
// Em produção, importe apenas deste arquivo.
// ============================================================

// [C04] Corrigido: todos os 8 AreaTypes do backend
export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "open" | "in_progress" | "pending" | "awaiting_user" | "resolved" | "cancelled";
export type Role = "user" | "client" | "support" | "admin" | "super_admin";
export type Area =
  | "TI"
  | "RH"
  | "Financeiro"
  | "Marketing"
  | "Vendas"
  | "Operações"
  | "Jurídico"
  | "Compras";

export const ALL_AREAS: Area[] = [
  "TI", "RH", "Financeiro", "Marketing", "Vendas", "Operações", "Jurídico", "Compras"
];

export interface Company {
  id: string;
  name: string;
  slug: string;
  planType: string;
  status: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string;
  authorRole: Role;
  content: string;
  createdAt: string;
  internal?: boolean;
}

export interface TicketHistory {
  id: string;
  action: string;
  by: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdBy: string;
  createdByRole: Role;
  assignedTo?: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  history: TicketHistory[];
  category: string;
  area: Area;
  companyId: string;
  formId?: string;
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
  createdBy: string;
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
  area: Area;
  companyId: string;
  createdAt: string;
  status?: string;
  position?: string;
  employment?: string;
}

// ── Config Objects for UI ──────────────────────────────────────

export const statusConfig: Record<Status, { label: string; class: string }> = {
  open: { label: "Aberto", class: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Em Andamento", class: "bg-yellow-100 text-yellow-700" },
  pending: { label: "Pendente", class: "bg-orange-100 text-orange-700" },
  awaiting_user: { label: "Aguardando Usuário", class: "bg-purple-100 text-purple-700" },
  resolved: { label: "Resolvido", class: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", class: "bg-gray-100 text-gray-500" },
};

export const priorityConfig: Record<Priority, { label: string; class: string }> = {
  low: { label: "Baixa", class: "bg-slate-100 text-slate-600" },
  medium: { label: "Média", class: "bg-blue-100 text-blue-600" },
  high: { label: "Alta", class: "bg-orange-100 text-orange-600" },
  critical: { label: "Crítica", class: "bg-red-100 text-red-700" },
};

export const roleConfig: Record<Role, { label: string; class: string }> = {
  user: { label: "Usuário", class: "bg-gray-100 text-gray-600" },
  client: { label: "Cliente", class: "bg-blue-50 text-blue-600" },
  support: { label: "Suporte", class: "bg-teal-100 text-teal-700" },
  admin: { label: "Admin", class: "bg-purple-100 text-purple-700" },
  super_admin: { label: "Super Admin", class: "bg-red-100 text-red-700" },
};
