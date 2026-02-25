// ============================================================
// AppContext — Dados de aplicação (tickets, forms, users, companies)
//
// MELHORIAS:
//  [A05] Separado do AuthContext (SRP respeitado)
//  [M01] Erros silenciosos eliminados — errors são propagados/logados
//  [M02] ROLE_USER usa /api/v1/tickets/my
//  Logs adequados em desenvolvimento
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import * as api from "@/lib/api";
import {
  mapAreaToFrontend,
  mapStatusToFrontend,
  mapStatusToBackend,
  mapRoleToFrontend,
  mapFieldTypeToFrontend,
  PRIORITY_BE_TO_FE,
  BackendUser,
  BackendForm,
  BackendTicketSummary,
  BackendTicket,
} from "@/lib/api";
import { useAuth } from "./AuthContext";
import type { Ticket, CustomForm, User, Company, Status, Area, Role } from "@/types/domain";

// ── Mappers ────────────────────────────────────────────────────

export function mapUser(u: BackendUser): User {
  return {
    id: u.userId,
    name: u.name,
    email: u.email,
    role: mapRoleToFrontend(u.roles),
    area: mapAreaToFrontend(u.area) as Area,
    companyId: u.companyId,
    createdAt: u.createdAt,
    status: u.status,
    position: u.position,
    employment: u.employment,
  };
}

export function mapForm(f: BackendForm): CustomForm {
  return {
    id: f.id,
    name: f.name,
    description: f.description || "",
    area: mapAreaToFrontend(f.areaType) as Area,
    companyId: "",
    createdBy: "",
    createdAt: f.createdAt,
    active: f.active,
    version: f.version,
    fields: (f.fields || [])
      .sort((a, b) => a.fieldOrder - b.fieldOrder)
      .map((field) => ({
        id: field.id,
        label: field.label,
        type: mapFieldTypeToFrontend(field.fieldType) as CustomForm["fields"][0]["type"],
        required: field.required,
        fieldOrder: field.fieldOrder,
        options: field.options
          ? field.options.split(",").map((o) => o.trim())
          : undefined,
      })),
  };
}

export function mapTicketSummary(t: BackendTicketSummary): Ticket {
  return {
    id: t.id,
    title: t.title,
    description: "",
    priority: (PRIORITY_BE_TO_FE[t.priority] || "medium") as Ticket["priority"],
    status: mapStatusToFrontend(t.status) as Status,
    createdBy: t.requesterName,
    createdByRole: "user" as Role,
    assignedTo: t.assigneeName || undefined,
    createdAt: t.createdAt,
    updatedAt: t.createdAt,
    comments: [],
    history: [],
    category: t.formName || "",
    area: mapAreaToFrontend(t.areaType) as Area,
    companyId: "",
    formId: undefined,
  };
}

export function mapTicketFull(t: BackendTicket): Ticket {
  return {
    id: t.id,
    title: t.title,
    description:
      t.formData?.map((d) => `${d.fieldLabel}: ${d.fieldValue}`).join("\n") || "",
    priority: (PRIORITY_BE_TO_FE[t.priority] || "medium") as Ticket["priority"],
    status: mapStatusToFrontend(t.status) as Status,
    createdBy: t.requesterName,
    createdByRole: "user" as Role,
    assignedTo: t.assigneeName || undefined,
    assigneeId: t.assigneeId || undefined,
    createdAt: t.createdAt,
    updatedAt: t.createdAt,
    comments: [],
    history: (t.history || []).map((h) => ({
      id: h.id,
      action: h.action,
      by: h.changedBy,
      createdAt: h.createdAt,
    })),
    category: t.formName || "",
    area: mapAreaToFrontend(t.areaType) as Area,
    companyId: t.companyId,
    formId: t.formId,
  };
}

// ── Types ──────────────────────────────────────────────────────

interface DataState {
  tickets: Ticket[];
  forms: CustomForm[];
  users: User[];
  assignableUsers: User[];
  companies: Company[];
  loading: boolean;
  error: string | null;
}

interface AppContextType extends DataState {
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;

  refreshTickets: () => Promise<void>;
  refreshForms: () => Promise<void>;
  refreshUsers: () => Promise<void>;

  addCompany: (payload: api.CreateCompanyPayload) => Promise<void>;
  addForm: (form: api.CreateFormPayload) => Promise<void>;
  addUser: (user: api.CreateUserPayload) => Promise<void>;

  updateTicketStatus: (id: string, status: Status) => Promise<void>;
  assignTicket: (id: string, assigneeId: string, assigneeName: string) => Promise<void>;
  addComment: (ticketId: string, content: string, internal?: boolean) => Promise<void>;
  getTicketFull: (id: string) => Promise<Ticket>;

  resetUserPassword: (id: string, newPassword: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const INITIAL_STATE: DataState = {
  tickets: [],
  forms: [],
  users: [],
  assignableUsers: [],
  companies: [],
  loading: false,
  error: null,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<DataState>(INITIAL_STATE);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const setLoading = (loading: boolean) =>
    setState((s) => ({ ...s, loading }));

  const setError = (error: string | null) =>
    setState((s) => ({ ...s, error }));

  const loadData = useCallback(async (companyId: string, userRole: Role) => {
    setLoading(true);
    setError(null);

    try {
      // [M02] Usuários comuns usam /my, admins/suporte usam lista geral
      const isPrivileged = userRole !== "user" && userRole !== "client";
      const ticketsFetch = isPrivileged
        ? api.getTickets(0, 100)
        : api.getMyTickets(0, 100);

      const [ticketsRes, formsRes, usersRes] = await Promise.allSettled([
        ticketsFetch,
        api.getActiveForms(),
        api.getUsers(0, 100),
      ]);

      const newState: Partial<DataState> = {};

      if (ticketsRes.status === "fulfilled") {
        newState.tickets = ticketsRes.value.content.map(mapTicketSummary);
      } else {
        // [M01] Erro não é mais silenciado
        console.error("[AppContext] Falha ao carregar tickets:", ticketsRes.reason);
      }

      if (formsRes.status === "fulfilled") {
        newState.forms = formsRes.value.map(mapForm);
      } else {
        console.error("[AppContext] Falha ao carregar formulários:", formsRes.reason);
      }

      if (usersRes.status === "fulfilled") {
        newState.users = usersRes.value.content.map(mapUser);
      } else {
        console.error("[AppContext] Falha ao carregar usuários:", usersRes.reason);
      }

      // Assignable users (não crítico)
      try {
        const assignable = await api.getAssignableUsers();
        newState.assignableUsers = assignable.map(mapUser);
      } catch (e) {
        console.warn("[AppContext] Não foi possível carregar usuários atribuíveis:", e);
      }

      // Company data (não crítico)
      try {
        const company = await api.getCompany(companyId);
        newState.companies = [{
          id: company.companyId,
          name: company.nameCompany,
          slug: company.nameCompany.toLowerCase().replace(/\s+/g, "-"),
          planType: company.planType,
          status: company.companyStatus,
          createdAt: company.createdAt,
        }];
      } catch (e) {
        console.warn("[AppContext] Não foi possível carregar dados da empresa:", e);
      }

      setState((s) => ({ ...s, ...newState, loading: false }));
    } catch (e: any) {
      console.error("[AppContext] Erro crítico no carregamento de dados:", e);
      setError(e?.message || "Erro ao carregar dados. Tente recarregar a página.");
      setLoading(false);
    }
  }, []);

  // Carrega dados quando usuário logar
  useEffect(() => {
    if (user) {
      setSelectedCompanyId(user.companyId);
      loadData(user.companyId, user.role);
    } else {
      // Reset quando deslogar
      setState(INITIAL_STATE);
      setSelectedCompanyId("");
    }
  }, [user?.id]); // Só recarrega se o ID do usuário mudar

  const refreshTickets = useCallback(async () => {
    if (!user) return;
    const isPrivileged = user.role !== "user" && user.role !== "client";
    const res = isPrivileged
      ? await api.getTickets(0, 100)
      : await api.getMyTickets(0, 100);
    setState((s) => ({ ...s, tickets: res.content.map(mapTicketSummary) }));
  }, [user]);

  const refreshForms = useCallback(async () => {
    const forms = await api.getActiveForms();
    setState((s) => ({ ...s, forms: forms.map(mapForm) }));
  }, []);

  const refreshUsers = useCallback(async () => {
    const page = await api.getUsers(0, 100);
    setState((s) => ({ ...s, users: page.content.map(mapUser) }));
  }, []);

  const addCompany = useCallback(async (payload: api.CreateCompanyPayload) => {
    const company = await api.createCompany(payload);
    setState((s) => ({
      ...s,
      companies: [...s.companies, {
        id: company.companyId,
        name: company.nameCompany,
        slug: company.nameCompany.toLowerCase().replace(/\s+/g, "-"),
        planType: company.planType,
        status: company.companyStatus,
        createdAt: company.createdAt,
      }],
    }));
  }, []);

  const updateTicketStatus = useCallback(async (id: string, status: Status) => {
    await api.updateTicketStatus(id, mapStatusToBackend(status));
    setState((s) => ({
      ...s,
      tickets: s.tickets.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }));
  }, []);

  const assignTicket = useCallback(
    async (id: string, assigneeId: string, assigneeName: string) => {
      await api.assignTicket(id, assigneeId, assigneeName);
      setState((s) => ({
        ...s,
        tickets: s.tickets.map((t) =>
          t.id === id
            ? { ...t, assignedTo: assigneeName, assigneeId, updatedAt: new Date().toISOString() }
            : t
        ),
      }));
    },
    []
  );

  const addComment = useCallback(
    async (ticketId: string, content: string, internal = false) => {
      await api.addComment(ticketId, content, internal);
    },
    []
  );

  const getTicketFull = useCallback(async (id: string): Promise<Ticket> => {
    const [t, comments] = await Promise.all([
      api.getTicketById(id),
      api.getComments(id),
    ]);
    const ticket = mapTicketFull(t);
    ticket.comments = comments.map((c) => ({
      id: c.id,
      author: c.authorName,
      authorRole: mapRoleToFrontend([c.authorRole]) as Role,
      content: c.content,
      createdAt: c.createdAt,
      internal: c.internal,
    }));
    return ticket;
  }, []);

  const addForm = useCallback(async (payload: api.CreateFormPayload) => {
    const form = await api.createForm(payload);
    setState((s) => ({ ...s, forms: [mapForm(form), ...s.forms] }));
  }, []);

  const addUser = useCallback(async (payload: api.CreateUserPayload) => {
    const user = await api.createUser(payload);
    setState((s) => ({ ...s, users: [...s.users, mapUser(user)] }));
  }, []);

  const resetUserPassword = useCallback(async (id: string, newPassword: string) => {
    await api.updateUserPassword(id, newPassword);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        selectedCompanyId,
        setSelectedCompanyId,
        refreshTickets,
        refreshForms,
        refreshUsers,
        addCompany,
        addForm,
        addUser,
        updateTicketStatus,
        assignTicket,
        addComment,
        getTicketFull,
        resetUserPassword,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
