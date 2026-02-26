import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { User, Role, Area, roleConfig } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, KeyRound, Users, Pencil, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { mapRoleToBackend, mapAreaToBackend, BackendRole, BackendArea, updateUserStatus, updateUserName, updateUserEmail, updateUserArea, addUserRole } from "@/lib/api";

const POSITION_OPTIONS = [
  { value: "ASSISTANT", label: "Assistente" },
  { value: "ANALYST", label: "Analista" },
  { value: "SENIOR_ANALYST", label: "Analista Sênior" },
  { value: "SPECIALIST", label: "Especialista" },
  { value: "COORDINATOR", label: "Coordenador" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "MANAGER", label: "Gerente" },
  { value: "HEAD", label: "Head" },
  { value: "DIRECTOR", label: "Diretor" },
  { value: "CFO", label: "CFO" },
  { value: "CTO", label: "CTO" },
  { value: "CEO", label: "CEO" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "INTERNAL", label: "CLT" },
  { value: "THIRD_PARTY", label: "Terceiro" },
  { value: "CONTRACTOR", label: "PJ" },
  { value: "INTERN", label: "Estagiário" },
];

// [CORRIGIDO] Apenas as áreas mapeadas no backend (sem "Suporte")
const AREA_OPTIONS: { value: Area; label: string }[] = [
  { value: "TI", label: "TI" },
  { value: "RH", label: "RH" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Marketing", label: "Marketing" },
  { value: "Vendas", label: "Vendas" },
  { value: "Operações", label: "Operações" },
  { value: "Jurídico", label: "Jurídico" },
  { value: "Compras", label: "Compras" },
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  cpf: "",
  rg: "",
  birthDate: "",
  phone: "",
  area: "TI" as Area,
  position: "ANALYST",
  employment: "INTERNAL",
  userRole: "user" as Role,
};

export default function UserManagementPage() {
  const { users, addUser, resetUserPassword, refreshUsers } = useApp();
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Edit form state
  const [editForm, setEditForm] = useState({ name: "", email: "", area: "TI" as Area, role: "user" as Role });

  const canManage = role === "admin" || role === "super_admin";
  const availableRoles: Role[] = role === "super_admin"
    ? ["user", "support", "admin", "super_admin"]
    : ["user", "support", "admin"];

  // ── Criar usuário ──────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.cpf || !form.rg || !form.birthDate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await addUser({
        name: form.name,
        email: form.email,
        password: form.password,
        cpf: form.cpf.replace(/\D/g, ""),
        rg: form.rg.replace(/\D/g, ""),
        birthDate: form.birthDate,
        phone: form.phone.replace(/\D/g, ""),
        area: mapAreaToBackend(form.area) as BackendArea,
        position: form.position,
        employment: form.employment,
        roles: [mapRoleToBackend(form.userRole) as BackendRole],
      });
      toast.success("Usuário criado com sucesso!");
      setForm(emptyForm);
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset de senha ─────────────────────────────────────────────
  const handleResetPassword = async (userId: string) => {
    if (!newPassword) { toast.error("Informe a nova senha."); return; }
    if (newPassword.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres."); return; }
    setSubmitting(true);
    try {
      await resetUserPassword(userId, newPassword);
      toast.success("Senha resetada com sucesso!");
      setNewPassword("");
      setResetOpen(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao resetar senha.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Ativar/Desativar usuário ────────────────────────────────────
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(userId);
    try {
      await updateUserStatus(userId, newStatus);
      await refreshUsers();
      toast.success(`Usuário ${newStatus === "ACTIVE" ? "ativado" : "desativado"} com sucesso!`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status do usuário.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Editar usuário ─────────────────────────────────────────────
  const handleEdit = async (userId: string, originalArea: Area, originalRole: Role) => {
    if (!editForm.name.trim() && !editForm.email.trim() && editForm.area === originalArea && editForm.role === originalRole) {
      toast.error("Nenhuma alteração detectada.");
      return;
    }
    setSubmitting(true);
    try {
      const updates: Promise<any>[] = [];
      if (editForm.name.trim()) updates.push(updateUserName(userId, editForm.name.trim()));
      if (editForm.email.trim()) updates.push(updateUserEmail(userId, editForm.email.trim()));
      if (editForm.area !== originalArea) {
        updates.push(updateUserArea(userId, mapAreaToBackend(editForm.area)));
      }
      if (editForm.role !== originalRole) {
        updates.push(addUserRole(userId, mapRoleToBackend(editForm.role) as BackendRole));
      }
      await Promise.all(updates);
      await refreshUsers();
      toast.success("Dados do usuário atualizados!");
      setEditOpen(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao editar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" /> Gestão de Usuários
          </h1>
          <p className="text-sm text-muted-foreground">
            {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Criar usuário */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Nome completo *</Label>
                <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="João da Silva" />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="joao@empresa.com" />
              </div>
              <div className="space-y-1">
                <Label>Senha * (mínimo 8 caracteres)</Label>
                <Input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>CPF *</Label>
                  <Input value={form.cpf} onChange={(e) => setField("cpf", e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1">
                  <Label>RG *</Label>
                  <Input value={form.rg} onChange={(e) => setField("rg", e.target.value)} placeholder="00.000.000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Data de Nascimento *</Label>
                  <Input type="date" value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="11999999999" maxLength={15} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Área *</Label>
                  <Select value={form.area} onValueChange={(v) => setField("area", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AREA_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Cargo *</Label>
                  <Select value={form.position} onValueChange={(v) => setField("position", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vínculo *</Label>
                  <Select value={form.employment} onValueChange={(v) => setField("employment", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_OPTIONS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Perfil *</Label>
                  <Select value={form.userRole} onValueChange={(v) => setField("userRole", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((r) => (
                        <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : "Criar Usuário"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleCfg = roleConfig[u.role] ?? roleConfig.user;
                  const isActive = u.status !== "INACTIVE";
                  return (
                    <TableRow key={u.id} className={!isActive ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${roleCfg.class}`}>
                          {roleCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{u.area}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${isActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {isActive ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">

                          <Dialog
                            open={editOpen === u.id}
                            onOpenChange={(o) => {
                              setEditOpen(o ? u.id : null);
                              if (o) setEditForm({ name: u.name, email: u.email, area: u.area, role: u.role });
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar — {u.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Nome</Label>
                                  <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Nome completo"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="email@empresa.com"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label>Área</Label>
                                    <Select value={editForm.area} onValueChange={(v) => setEditForm(f => ({ ...f, area: v as Area }))}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {AREA_OPTIONS.map((a) => (
                                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Perfil</Label>
                                    <Select value={editForm.role} onValueChange={(v) => setEditForm(f => ({ ...f, role: v as Role }))}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {availableRoles.map((r) => (
                                          <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleEdit(u.id, u.area, u.role)}
                                  className="w-full"
                                  disabled={submitting}
                                >
                                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Alterações"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Reset de senha */}
                          <Dialog
                            open={resetOpen === u.id}
                            onOpenChange={(o) => { setResetOpen(o ? u.id : null); setNewPassword(""); }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                                <KeyRound className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resetar Senha — {u.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Nova Senha (mínimo 8 caracteres)</Label>
                                  <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nova senha"
                                  />
                                </div>
                                <Button
                                  onClick={() => handleResetPassword(u.id)}
                                  className="w-full"
                                  disabled={submitting}
                                >
                                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Confirmar"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Ativar/Desativar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 h-7 text-xs"
                            disabled={togglingId === u.id}
                            onClick={() => handleToggleStatus(u.id, u.status || "ACTIVE")}
                            title={isActive ? "Desativar usuário" : "Ativar usuário"}
                          >
                            {togglingId === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isActive ? (
                              <ToggleRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ToggleLeft className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
