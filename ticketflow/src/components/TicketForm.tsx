import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Layers,
  FileText,
  AlertCircle,
} from "lucide-react";

import * as api from "@/lib/api";
import {
  mapAreaToFrontend,
  mapAreaToBackend,
  mapFieldTypeToFrontend,
  PRIORITY_FE_TO_BE,
  BackendArea,
} from "@/lib/api";

import type {
  Priority,
  Area,
  CustomForm,
  FormField,
} from "@/types/domain";

/* ------------------ Dynamic Field ------------------ */

function DynamicField({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const baseClass = error ? "border-destructive focus-visible:ring-destructive" : "";

  switch (field.type) {
    case "text":
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder={field.required ? "Campo obrigatório" : ""}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );

    case "email":
      return (
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder={field.required ? "Campo obrigatório" : ""}
        />
      );

    case "textarea":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={`resize-none ${baseClass}`}
          placeholder={field.required ? "Campo obrigatório" : ""}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm">{field.label}</span>
        </div>
      );

    case "dropdown":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={baseClass}>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
  }
}

/* ------------------ Ticket Form ------------------ */

export function TicketForm() {
  const navigate = useNavigate();

  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedArea, setSelectedArea] = useState<Area | "">("");
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* ------------------ Load Forms (Backend) ------------------ */

  useEffect(() => {
    async function loadForms() {
      try {
        const backendForms = await api.getActiveForms();

        const mapped: CustomForm[] = backendForms.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description || "",
          createdBy: "",
          createdAt: f.createdAt,
          companyId: "",
          area: mapAreaToFrontend(f.areaType) as Area,
          active: f.active,
          version: f.version,
          fields: (f.fields || [])
            .sort((a, b) => a.fieldOrder - b.fieldOrder)
            .map((field) => ({
              id: field.id,
              label: field.label,
              required: field.required,
              fieldOrder: field.fieldOrder,
              type: mapFieldTypeToFrontend(field.fieldType) as FormField["type"],
              options: field.options
                ? field.options.split(",").map((o) => o.trim())
                : undefined,
            })),
        }));

        setForms(mapped);
      } catch (err: any) {
        toast.error(err?.message || "Erro ao carregar formulários.");
      } finally {
        setLoadingForms(false);
      }
    }

    loadForms();
  }, []);

  const availableAreas = useMemo(
    () => Array.from(new Set(forms.map((f) => f.area))),
    [forms]
  );

  const areaForms = selectedArea
    ? forms.filter((f) => f.area === selectedArea)
    : [];

  useEffect(() => {
    if (selectedForm) {
      const initial: Record<string, string> = {};
      selectedForm.fields.forEach((f) => {
        initial[f.id] = "";
      });
      setFieldValues(initial);
      setFieldErrors({});
    }
  }, [selectedForm]);

  /* ------------------ Validation ------------------ */

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    let valid = true;

    if (!title.trim()) {
      setTitleError("O título é obrigatório.");
      valid = false;
    } else {
      setTitleError("");
    }

    if (selectedForm) {
      selectedForm.fields.forEach((field) => {
        if (field.required) {
          const val = fieldValues[field.id] ?? "";
          if (!val.trim() || val === "false") {
            errors[field.id] = `"${field.label}" é obrigatório.`;
            valid = false;
          }
        }
      });
    }

    setFieldErrors(errors);
    return valid;
  };

  /* ------------------ Submit ------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      toast.error("Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    if (!selectedArea || !selectedForm) {
      toast.error("Selecione uma área e um formulário.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = selectedForm.fields.map((field, idx) => ({
        fieldLabel: field.label,
        fieldValue: fieldValues[field.id] || "",
        fieldOrder: idx,
      }));

      const created = await api.createTicket({
        formId: selectedForm.id,
        title,
        areaType: mapAreaToBackend(selectedArea as Area),
        priority: PRIORITY_FE_TO_BE[priority],
        formData,
      });

      toast.success("Ticket criado com sucesso!");
      setStep(4);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------ Loading ------------------ */

  if (loadingForms) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  /* ------------------ Success ------------------ */

  if (step === 4) {
    return (
      <Card className="max-w-md mx-auto text-center p-8">
        <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ticket criado com sucesso!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Seu chamado foi aberto. Você pode acompanhar o andamento na lista de tickets.
        </p>
        <Button onClick={() => navigate("/")}>Ver Tickets</Button>
      </Card>
    );
  }

  /* ------------------ STEP 1: Selecionar Área ------------------ */

  if (step === 1) {
    if (availableAreas.length === 0) {
      return (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Nova Solicitação</CardTitle>
            <CardDescription>
              Nenhum formulário ativo encontrado. Entre em contato com o suporte.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Nova Solicitação</CardTitle>
          <CardDescription>
            Selecione a área responsável pela sua solicitação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableAreas.map((area) => (
            <Button
              key={area}
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setSelectedArea(area);
                setStep(2);
              }}
            >
              <Layers className="h-4 w-4 mr-2" />
              {area}
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }

  /* ------------------ STEP 2: Selecionar Formulário ------------------ */

  if (step === 2) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Selecione o Tipo de Solicitação</CardTitle>
          <CardDescription>Área: {selectedArea}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {areaForms.map((form) => (
            <Button
              key={form.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setSelectedForm(form);
                setStep(3);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div>{form.name}</div>
                {form.description && (
                  <div className="text-xs text-muted-foreground font-normal">{form.description}</div>
                )}
              </div>
            </Button>
          ))}

          <Button variant="ghost" onClick={() => setStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ------------------ STEP 3: Preencher Formulário ------------------ */

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{selectedForm?.name}</CardTitle>
        <CardDescription>
          Área: {selectedArea} · Preencha todos os campos obrigatórios (*)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError("");
              }}
              placeholder="Descreva brevemente sua solicitação"
              className={titleError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {titleError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {titleError}
              </p>
            )}
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos dinâmicos do formulário */}
          {selectedForm?.fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <DynamicField
                field={field}
                value={fieldValues[field.id] ?? ""}
                onChange={(v) => {
                  setFieldValues((prev) => ({ ...prev, [field.id]: v }));
                  if (v.trim()) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next[field.id];
                      return next;
                    });
                  }
                }}
                error={fieldErrors[field.id]}
              />
              {fieldErrors[field.id] && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors[field.id]}
                </p>
              )}
            </div>
          ))}

          {/* Aviso de campos obrigatórios */}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Existem campos obrigatórios não preenchidos. Revise os erros acima.</span>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                "Criar Ticket"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
