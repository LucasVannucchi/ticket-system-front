import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { DynamicFormBuilder } from "@/components/DynamicFormBuilder";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileText, ToggleLeft, ToggleRight, Trash2, Loader2, Pencil, Plus, GripVertical,
} from "lucide-react";
import * as api from "@/lib/api";
import { mapAreaToBackend, mapFieldTypeToBackend, BackendArea } from "@/lib/api";
import { Navigate } from "react-router-dom";
import type { CustomForm, FormField, Area } from "@/types/domain";
import { ALL_AREAS } from "@/types/domain";

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "email", label: "E-mail" },
  { value: "date", label: "Data" },
  { value: "dropdown", label: "Seleção" },
  { value: "checkbox", label: "Checkbox" },
];

interface EditFieldState {
  id: string;
  label: string;
  type: FormField["type"];
  required: boolean;
  options?: string[];
  fieldOrder: number;
  optionsRaw?: string;
}

function EditFormDialog({
  form,
  open,
  onClose,
  onSaved,
}: {
  form: CustomForm;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { updateForm } = useApp();
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description);
  const [area, setArea] = useState<Area>(form.area);
  const [fields, setFields] = useState<EditFieldState[]>(
    form.fields.map((f) => ({
      ...f,
      optionsRaw: f.options?.join(", ") ?? "",
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  const addField = () => {
    const newField: EditFieldState = {
      id: `temp-${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      fieldOrder: fields.length + 1,
      optionsRaw: "",
    };
    setFields((prev) => [...prev, newField]);
  };

  const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

  const updateField = (id: string, key: keyof EditFieldState, value: any) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)));

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Informe o nome do formulário."); return; }
    if (!area) { toast.error("Selecione uma área."); return; }
    if (fields.length === 0) { toast.error("Adicione pelo menos um campo."); return; }
    const emptyLabel = fields.find((f) => !f.label.trim());
    if (emptyLabel) { toast.error("Todos os campos devem ter um rótulo."); return; }

    setSubmitting(true);
    try {
      const payload: api.CreateFormPayload = {
        name: name.trim(),
        description: description.trim(),
        areaType: mapAreaToBackend(area) as BackendArea,
        fields: fields.map((f, idx) => ({
          label: f.label.trim(),
          fieldType: mapFieldTypeToBackend(f.type),
          required: f.required,
          fieldOrder: idx + 1,
          options: (f.type === "dropdown" && f.optionsRaw?.trim())
            ? f.optionsRaw.trim()
            : undefined,
        })),
      };
      await updateForm(form.id, payload);
      toast.success("Formulário atualizado com sucesso!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar formulário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Formulário — {form.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Área *</Label>
              <Select value={area} onValueChange={(v) => setArea(v as Area)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Campos ({fields.length})</Label>
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={addField}>
                <Plus className="h-3.5 w-3.5" /> Adicionar Campo
              </Button>
            </div>

            {fields.map((field, idx) => (
              <Card key={field.id} className="border border-border">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Rótulo do campo *"
                        value={field.label}
                        onChange={(e) => updateField(field.id, "label", e.target.value)}
                        className="text-sm"
                      />
                      <Select
                        value={field.type}
                        onValueChange={(v) => updateField(field.id, "type", v)}
                      >
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 pl-7">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(v) => updateField(field.id, "required", Boolean(v))}
                      />
                      Obrigatório
                    </label>

                    {field.type === "dropdown" && (
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Opções (separadas por vírgula)</Label>
                        <Input
                          value={field.optionsRaw ?? ""}
                          onChange={(e) => updateField(field.id, "optionsRaw", e.target.value)}
                          placeholder="Opção A, Opção B, Opção C"
                          className="text-xs h-7"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button className="w-full" onClick={handleSave} disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FormsPage() {
  const { forms, refreshForms } = useApp();
  const { user, isInitializing } = useAuth();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);

  const canCreate = useMemo(() => {
    if (!user) return false;
    return user.role === "admin" || user.role === "super_admin";
  }, [user]);

  const canManage = useMemo(() => {
    if (!user) return false;
    return user.role === "admin" || user.role === "super_admin" || user.role === "support";
  }, [user]);

  if (isInitializing) {
    return <div className="py-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!canManage) {
    return <Navigate to="/" replace />;
  }

  const handleToggle = async (formId: string) => {
    setTogglingId(formId);
    try {
      await api.toggleFormActive(formId);
      await refreshForms();
      toast.success("Status do formulário atualizado.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar formulário.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este formulário? Bloqueado se existirem tickets vinculados.")) return;
    setDeletingId(formId);
    try {
      await api.deleteForm(formId);
      await refreshForms();
      toast.success("Formulário excluído.");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível excluir. Verifique se existem tickets vinculados.");
    } finally {
      setDeletingId(null);
    }
  };

  const FormsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map((form) => (
        <Card key={form.id} className={`flex flex-col ${!form.active ? "opacity-60 border-dashed" : ""}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <CardTitle className="text-sm truncate">{form.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0 ml-2">{form.area}</Badge>
            </div>
            {form.description && (
              <CardDescription className="text-xs">{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <p className="text-xs text-muted-foreground">
              {form.fields.length} campo{form.fields.length !== 1 ? "s" : ""}
              {" · "}
              <span className={form.active ? "text-green-600 dark:text-green-400 font-medium" : "text-orange-500 dark:text-orange-400 font-medium"}>
                {form.active ? "Ativo" : "Inativo"}
              </span>
              {form.version && <> · v{form.version}</>}
            </p>

            {/* Preview do formulário */}
            <DynamicFormRenderer form={form} />

            {/* Ações */}
            <div className="flex items-center gap-2 pt-1">
              {/* Ativar/Desativar — support e superiores */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                disabled={togglingId === form.id}
                onClick={() => handleToggle(form.id)}
              >
                {togglingId === form.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : form.active ? (
                  <ToggleRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                ) : (
                  <ToggleLeft className="h-3 w-3 text-orange-500" />
                )}
                {form.active ? "Desativar" : "Ativar"}
              </Button>

              {/* Editar — somente admin e super_admin */}
              {canCreate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => setEditingForm(form)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Excluir — somente admin e super_admin */}
              {canCreate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deletingId === form.id}
                  onClick={() => handleDelete(form.id)}
                >
                  {deletingId === form.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {forms.length === 0 && (
        <p className="text-sm text-muted-foreground col-span-full text-center py-8">
          {canCreate
            ? "Nenhum formulário criado ainda. Use a aba \"Criar Novo\" para começar."
            : "Nenhum formulário disponível no momento."}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Formulários</h1>
        <p className="text-sm text-muted-foreground">
          {canCreate
            ? "Crie e gerencie formulários dinâmicos para abertura de tickets"
            : "Visualize e gerencie os formulários existentes (incluindo inativos)"}
        </p>
      </header>

      {canCreate ? (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Formulários ({forms.length})</TabsTrigger>
            <TabsTrigger value="create">Criar Novo</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4">
            <FormsGrid />
          </TabsContent>
          <TabsContent value="create" className="mt-4">
            <DynamicFormBuilder />
          </TabsContent>
        </Tabs>
      ) : (
        /* Support: visualização + toggle, sem criação */
        <FormsGrid />
      )}

      {/* Dialog de edição */}
      {editingForm && (
        <EditFormDialog
          form={editingForm}
          open={!!editingForm}
          onClose={() => setEditingForm(null)}
          onSaved={refreshForms}
        />
      )}
    </div>
  );
}
