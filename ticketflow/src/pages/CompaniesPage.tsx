import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Building2, Pencil, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import * as api from "@/lib/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const PLAN_OPTIONS = [
  { value: "STARTER", label: "Starter" },
  { value: "TRIAL", label: "Trial" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "BUSINESS", label: "Business" },
];

const planColors: Record<string, string> = {
  BASIC: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  STANDARD: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PREMIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500",
};

export default function CompaniesPage() {
  const { companies, addCompany, refreshUsers } = useApp();
  const { user } = useAuth();
  const role = user?.role ?? "user";

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    nameCompany: "", document: "", emailCompany: "", phoneCompany: "", planType: "BASIC",
  });

  const [editForm, setEditForm] = useState({
    nameCompany: "", emailCompany: "", phoneCompany: "", document: "", planType: "BASIC",
  });

  if (role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a Super Admin.</p>
      </div>
    );
  }

  const setCreateField = (field: string, value: string) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nameCompany.trim() || !createForm.document.trim() || !createForm.emailCompany.trim()) {
      toast.error("Preencha os campos obrigatórios: Razão Social, CNPJ e E-mail.");
      return;
    }
    const cnpj = createForm.document.replace(/\D/g, "");
    if (cnpj.length !== 14) { toast.error("CNPJ inválido (deve ter 14 dígitos)."); return; }
    setSubmitting(true);
    try {
      await addCompany({
        nameCompany: createForm.nameCompany,
        document: cnpj,
        emailCompany: createForm.emailCompany,
        phoneCompany: createForm.phoneCompany.replace(/\D/g, ""),
        planType: createForm.planType,
      });
      toast.success("Empresa criada com sucesso!");
      setCreateForm({ nameCompany: "", document: "", emailCompany: "", phoneCompany: "", planType: "BASIC" });
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar empresa.");
    } finally { setSubmitting(false); }
  };

  const handleEdit = async (companyId: string) => {
    setSubmitting(true);
    try {
      const updates: Promise<any>[] = [];
      if (editForm.nameCompany.trim()) updates.push(api.updateCompanyName(companyId, editForm.nameCompany.trim()));
      if (editForm.emailCompany.trim()) updates.push(api.updateCompanyEmail(companyId, editForm.emailCompany.trim()));
      if (editForm.phoneCompany.trim()) updates.push(api.updateCompanyPhone(companyId, editForm.phoneCompany.replace(/\D/g, "")));
      if (editForm.document.trim()) updates.push(api.updateCompanyDocument(companyId, editForm.document.replace(/\D/g, "")));
      if (editForm.planType) updates.push(api.updateCompanyPlan(companyId, editForm.planType));

      if (updates.length === 0) { toast.error("Nenhum campo alterado."); setSubmitting(false); return; }
      await Promise.all(updates);
      toast.success("Dados da empresa atualizados!");
      setEditOpen(null);
      // Recarregar dados
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao editar empresa.");
    } finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(companyId);
    try {
      await api.updateCompanyStatus(companyId, newStatus);
      toast.success(`Empresa ${newStatus === "ACTIVE" ? "ativada" : "desativada"} com sucesso!`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status.");
    } finally { setTogglingId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Empresas
          </h1>
          <p className="text-sm text-muted-foreground">
            {companies.length} empresa{companies.length !== 1 ? "s" : ""} cadastrada{companies.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Empresa</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Razão Social *</Label>
                <Input value={createForm.nameCompany} onChange={(e) => setCreateField("nameCompany", e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div className="space-y-1">
                <Label>CNPJ * (14 dígitos)</Label>
                <Input value={createForm.document} onChange={(e) => setCreateField("document", e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1">
                <Label>E-mail *</Label>
                <Input type="email" value={createForm.emailCompany} onChange={(e) => setCreateField("emailCompany", e.target.value)} placeholder="contato@empresa.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input value={createForm.phoneCompany} onChange={(e) => setCreateField("phoneCompany", e.target.value)} placeholder="11999999999" />
                </div>
                <div className="space-y-1">
                  <Label>Plano</Label>
                  <Select value={createForm.planType} onValueChange={(v) => setCreateField("planType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : "Criar Empresa"}
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
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : (
                companies.map((c) => {
                  const isActive = c.status !== "INACTIVE";
                  return (
                    <TableRow key={c.id} className={!isActive ? "opacity-60" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{c.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${planColors[c.planType] ?? ""}`}>
                          {c.planType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${isActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {isActive ? "Ativa" : "Inativa"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Editar */}
                          <Dialog
                            open={editOpen === c.id}
                            onOpenChange={(o) => {
                              setEditOpen(o ? c.id : null);
                              if (o) setEditForm({ nameCompany: c.name, emailCompany: "", phoneCompany: "", document: "", planType: c.planType });
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Editar — {c.name}</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <Label>Razão Social</Label>
                                  <Input value={editForm.nameCompany} onChange={(e) => setEditForm(f => ({ ...f, nameCompany: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                  <Label>E-mail</Label>
                                  <Input type="email" value={editForm.emailCompany} onChange={(e) => setEditForm(f => ({ ...f, emailCompany: e.target.value }))} placeholder="Deixe vazio para não alterar" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label>Telefone</Label>
                                    <Input value={editForm.phoneCompany} onChange={(e) => setEditForm(f => ({ ...f, phoneCompany: e.target.value }))} placeholder="Deixe vazio para não alterar" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>CNPJ</Label>
                                    <Input value={editForm.document} onChange={(e) => setEditForm(f => ({ ...f, document: e.target.value }))} placeholder="Deixe vazio para não alterar" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label>Plano</Label>
                                  <Select value={editForm.planType} onValueChange={(v) => setEditForm(f => ({ ...f, planType: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {PLAN_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={() => handleEdit(c.id)} className="w-full" disabled={submitting}>
                                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Alterações"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Toggle status */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            disabled={togglingId === c.id}
                            onClick={() => handleToggleStatus(c.id, c.status || "ACTIVE")}
                            title={isActive ? "Desativar empresa" : "Ativar empresa"}
                          >
                            {togglingId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
