import { useState } from "react";
import { CustomForm, FormField } from "@/lib/mock-data";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Building2 } from "lucide-react";

function DynamicField({ field }: { field: FormField }) {
  switch (field.type) {
    case "text": return <Input placeholder={field.label} />;
    case "number": return <Input type="number" placeholder={field.label} />;
    case "email": return <Input type="email" placeholder={field.label} />;
    case "textarea": return <Textarea placeholder={field.label} rows={3} />;
    case "date": return <Input type="date" />;
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox id={field.id} />
          <label htmlFor={field.id} className="text-sm">{field.label}</label>
        </div>
      );
    case "dropdown":
      return (
        <Select>
          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    default: return <Input />;
  }
}

export function DynamicFormRenderer({ form }: { form: CustomForm }) {
  const [open, setOpen] = useState(false);
  const { companies } = useApp();
  const company = companies.find(c => c.id === form.companyId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-all hover:border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">{form.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">{form.area}</Badge>
            </div>
            <CardDescription className="text-xs">{form.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{form.fields.length} campo{form.fields.length !== 1 ? "s" : ""}</p>
              {company && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-2.5 w-2.5" />{company.name}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Formulário enviado!"); setOpen(false); }} className="space-y-4">
          {form.fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              {field.type !== "checkbox" && (
                <Label className="text-sm">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
              )}
              <DynamicField field={field} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button type="submit">Enviar</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
