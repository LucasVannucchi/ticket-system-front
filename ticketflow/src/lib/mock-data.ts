// ============================================================
// mock-data.ts — RE-EXPORTS TYPES + MOCK DATA
//
// ATENÇÃO: Este arquivo re-exporta os tipos do domain.ts
// para manter compatibilidade com código existente.
//
// NOVO CÓDIGO deve importar de "@/types/domain" diretamente.
//
// MOCK DATA é apenas para desenvolvimento/testes.
// ============================================================

// Re-exporta todos os tipos do domain.ts (evita breaking changes)
export type {
  Priority,
  Status,
  Role,
  Area,
  SlaStatus,
  Company,
  Comment,
  TicketHistory,
  Ticket,
  FormField,
  CustomForm,
  User,
} from "@/types/domain";

export {
  ALL_AREAS as areas,
  statusConfig,
  priorityConfig,
  roleConfig,
} from "@/types/domain";

// Mock data — apenas desenvolvimento
// Em produção todos os dados vêm do backend

import type { Company, User, Ticket } from "@/types/domain";

export const mockCompanies: Company[] = [
  { id: "comp-1", name: "Acme Corp", slug: "acme", planType: "PREMIUM", status: "ACTIVE", createdAt: "2025-06-01T10:00:00" },
  { id: "comp-2", name: "TechNova Ltda", slug: "technova", planType: "STANDARD", status: "ACTIVE", createdAt: "2025-08-15T10:00:00" },
];

export const mockUsers: User[] = [
  { id: "u1", name: "Super Admin", email: "super@helpdesk.com", role: "super_admin", area: "TI", companyId: "comp-1", createdAt: "2025-06-01T10:00:00" },
  { id: "u2", name: "Carlos Mendes", email: "carlos@acme.com", role: "admin", area: "TI", companyId: "comp-1", createdAt: "2025-06-10T10:00:00" },
  { id: "u3", name: "Ana Costa", email: "ana@acme.com", role: "support", area: "TI", companyId: "comp-1", createdAt: "2025-06-15T10:00:00" },
];

export const mockTickets: Ticket[] = [];
