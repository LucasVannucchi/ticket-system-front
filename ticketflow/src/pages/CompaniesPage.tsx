import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Building2 } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const PLAN_OPTIONS = [
  { value: "FREE", label: "Free" },
  { value: "BASIC", label: "Basic" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

export default function CompaniesPage() {
  const { companies, addCompany } = useApp();
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nameCompany: "",
    document: "",
    emailCompany: "",
    phoneCompany: "",
    planType: "BASIC",
  });
  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a Super Admin.</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameCompany.trim() || !form.document.trim() || !form.emailCompany.trim()) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      await addCompany({
        nameCompany: form.nameCompany,
        document: form.document,
        emailCompany: form.emailCompany,
        phoneCompany: form.phoneCompany.replace(/\D/g, ""),
        planType: form.planType,
      });
      toast.success("Empresa criada com sucesso!");
      setForm({ nameCompany: "", document: "", emailCompany: "", phoneCompany: "", planType: "BASIC" });
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar empresa.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Empresas
          </h1>
          <p className="text-sm text-muted-foreground">
            {companies.length} empresa{companies.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Empresa</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Razão Social *</Label>
                <Input value={form.nameCompany} onChange={(e) => setField("nameCompany", e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div className="space-y-1">
                <Label>CNPJ *</Label>
                <Input value={form.document} onChange={(e) => setField("document", e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={form.emailCompany} onChange={(e) => setField("emailCompany", e.target.value)} placeholder="contato@empresa.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input value={form.phoneCompany} onChange={(e) => setField("phoneCompany", e.target.value)} placeholder="11999999999" />
                </div>
                <div className="space-y-1">
                  <Label>Plano</Label>
                  <Select value={form.planType} onValueChange={(v) => setField("planType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Criando..." : "Criar"}
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
                <TableHead>ID</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{c.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
