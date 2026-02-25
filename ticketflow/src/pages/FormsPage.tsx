import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { DynamicFormBuilder } from "@/components/DynamicFormBuilder";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FormsPage() {
  const { forms } = useApp();
  const { user, isInitializing } = useAuth();

  /**
   * Permissão calculada de forma tipada e segura
   * Backend → ROLE_ADMIN
   * Mapper → "admin"
   */
  const canCreate = useMemo(() => {
    if (!user) return false;

    return (
      user.role === "admin" ||
      user.role === "super_admin" ||
      user.role === "support"
    );
  }, [user]);

  if (isInitializing) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const FormsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map((form) => (
        <DynamicFormRenderer key={form.id} form={form} />
      ))}

      {forms.length === 0 && (
        <p className="text-sm text-muted-foreground col-span-full text-center py-8">
          {canCreate
            ? "Nenhum formulário criado."
            : "Nenhum formulário disponível."}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          Formulários
        </h1>
        <p className="text-sm text-muted-foreground">
          {canCreate
            ? "Crie e gerencie formulários dinâmicos"
            : "Formulários disponíveis"}
        </p>
      </header>

      {canCreate ? (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">
              Formulários ({forms.length})
            </TabsTrigger>
            <TabsTrigger value="create">
              Criar Novo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <FormsGrid />
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <DynamicFormBuilder />
          </TabsContent>
        </Tabs>
      ) : (
        <FormsGrid />
      )}
    </div>
  );
}