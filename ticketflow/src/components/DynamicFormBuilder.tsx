import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { FormField, Area, areas } from "@/lib/mock-data";
import { mapAreaToBackend, mapFieldTypeToBackend, BackendArea } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Eye, GripVertical } from "lucide-react";
import { toast } from "sonner";

function FieldPreview({ field }: { field: FormField }) {
  switch (field.type) {
    case "text": return <Input placeholder={field.label} disabled className="opacity-60" />;
    case "number": return <Input type="number" placeholder={field.label} disabled className="opacity-60" />;
    case "email": return <Input type="email" placeholder={field.label} disabled className="opacity-60" />;
    case "textarea": return <Textarea placeholder={field.label} rows={2} disabled className="opacity-60" />;
    case "date": return <Input type="date" disabled className="opacity-60" />;
    case "checkbox":
      return (
        <div className="flex items-center gap-2 opacity-60">
          <Checkbox disabled />
          <span className="text-sm">{field.label}</span>
        </div>
      );
    case "dropdown":
      return (
        <Select disabled>
          <SelectTrigger className="opacity-60"><SelectValue placeholder={field.options?.[0] || "Selecionar..."} /></SelectTrigger>
        </Select>
      );
    default: return <Input disabled className="opacity-60" />;
  }
}

export function DynamicFormBuilder() {
  const { addForm, companies, selectedCompanyId } = useApp();
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<Area | "">("");
  const [companyId, setCompanyId] = useState(role === "super_admin" ? selectedCompanyId : (user?.companyId ?? ""));
  const [fields, setFields] = useState<FormField[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  const addField = () => {
    setFields([...fields, { id: `f-${Date.now()}`, label: "", type: "text", required: false }]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !area || fields.length === 0) {
      toast.error("Defina um nome, área e ao menos um campo.");
      return;
    }
    if (fields.some(f => !f.label.trim())) {
      toast.error("Todos os campos precisam de um rótulo.");
      return;
    }
    addForm({
      name,
      description,
      areaType: mapAreaToBackend(area as Area) as BackendArea,
      fields: fields.map((f, idx) => ({
        label: f.label,
        fieldType: mapFieldTypeToBackend(f.type),
        required: f.required,
        fieldOrder: idx,
        options: f.options?.join(","),
      })),
    }).then(() => {
      toast.success("Formulário criado!");
      setName(""); setDescription(""); setArea(""); setFields([]);
    }).catch((err: any) => {
      toast.error(err?.message || "Erro ao criar formulário.");
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Criar Formulário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === "super_admin" && (
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Solicitação de Equipamento" />
              </div>
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={area} onValueChange={(v) => setArea(v as Area)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar área..." /></SelectTrigger>
                  <SelectContent>
                    {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Campos ({fields.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Campo
                </Button>
              </div>

              {fields.map((field, i) => (
                <div key={field.id} className="flex flex-col gap-2 p-3 rounded-md border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveField(i, -1)} className="text-muted-foreground hover:text-foreground" disabled={i === 0}>
                        <GripVertical className="h-3 w-3" />
                      </button>
                    </div>
                    <Input
                      placeholder="Rótulo"
                      value={field.label}
                      onChange={(e) => updateField(i, { label: e.target.value })}
                      className="flex-1"
                    />
                    <Select value={field.type} onValueChange={(v) => updateField(i, { type: v as FormField["type"] })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="textarea">Área de texto</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="date">Data</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Checkbox checked={field.required} onCheckedChange={(v) => updateField(i, { required: !!v })} />
                      <span className="text-xs text-muted-foreground">Obrig.</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeField(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  {field.type === "dropdown" && (
                    <Input
                      placeholder="Opções (separadas por vírgula)"
                      value={field.options?.join(", ") || ""}
                      onChange={(e) => updateField(i, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      className="ml-6"
                    />
                  )}
                </div>
              ))}

              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum campo adicionado.</p>
              )}
            </div>

            <Button type="submit" disabled={!name.trim() || !area || fields.length === 0}>Salvar Formulário</Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Adicione campos para ver o preview.</p>
          ) : (
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/20">
              {name && <h3 className="text-sm font-semibold text-foreground">{name}</h3>}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              <Separator />
              {fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  {field.type !== "checkbox" && (
                    <Label className="text-sm">
                      {field.label || "Sem rótulo"} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                  )}
                  <FieldPreview field={field} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
