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
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  switch (field.type) {
    case "text":
      return <Input value={value} onChange={(e) => onChange(e.target.value)} />;

    case "number":
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "email":
      return (
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) =>
              onChange(e.target.checked ? "true" : "false")
            }
          />
          <span className="text-sm">{field.label}</span>
        </div>
      );

    case "dropdown":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
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
      return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
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
  const [priority, setPriority] = useState<Priority>("medium");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* ------------------ Load Forms (Backend Driven) ------------------ */

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
              type: mapFieldTypeToFrontend(field.fieldType) as any,
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
    }
  }, [selectedForm]);

  /* ------------------ Submit ------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !selectedArea || !selectedForm) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = selectedForm.fields.map((field, idx) => ({
        fieldLabel: field.label,
        fieldValue: fieldValues[field.id] || "",
        fieldOrder: idx,
      }));

      await api.createTicket({
        formId: selectedForm.id,
        title,
        areaType: mapAreaToBackend(selectedArea as Area),
        priority: PRIORITY_FE_TO_BE[priority],
        formData,
      });

      navigate("/tickets");

      // 🔥 força recarregar a aplicação inteira
      window.location.reload();

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
        <h2 className="text-xl font-semibold mb-2">
          Ticket criado com sucesso!
        </h2>
        <Button onClick={() => navigate("/tickets")}>
          Ver Tickets
        </Button>
      </Card>
    );
  }

  /* ------------------ STEP 1 ------------------ */

  if (step === 1) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Nova Solicitação</CardTitle>
          <CardDescription>
            Selecione a área
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

  /* ------------------ STEP 2 ------------------ */

  if (step === 2) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Selecione o Formulário</CardTitle>
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
              {form.name}
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

  /* ------------------ STEP 3 ------------------ */

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{selectedForm?.name}</CardTitle>
        <CardDescription>Área: {selectedArea}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
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

          {selectedForm?.fields.map((field) => (
            <div key={field.id}>
              <Label>{field.label}</Label>
              <DynamicField
                field={field}
                value={fieldValues[field.id]}
                onChange={(v) =>
                  setFieldValues((prev) => ({
                    ...prev,
                    [field.id]: v,
                  }))
                }
              />
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
            >
              Voltar
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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