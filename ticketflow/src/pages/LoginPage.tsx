import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";
import { Lock, Mail, Building2, AlertCircle } from "lucide-react";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!UUID_REGEX.test(companyId.trim())) {
      toast.error("O ID da empresa deve ser um UUID válido (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, companyId.trim());
      toast.success("Login realizado com sucesso!");
      navigate("/", { replace: true });
    } catch (err: any) {
      const msg = err?.message || "Erro ao conectar com o servidor.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          {/* Ícone principal com gradiente e animação */}
          <div
            className="
              mx-auto h-12 w-12 rounded-xl
              bg-gradient-to-br from-primary/10 to-primary/20
              flex items-center justify-center
              animate-[float_3s_ease-in-out_infinite]
            "
          >
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Desk360</h1>
          <p className="text-sm text-muted-foreground">Tudo o que seu atendimento precisa em um só lugar!</p>
        </div>

        {/* Animação keyframes */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}</style>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription className="text-xs">Acesse com suas credenciais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {serverError && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setServerError(""); }}
                    placeholder="seu@email.com"
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setServerError(""); }}
                    placeholder="••••••••"
                    className="pl-9"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">Código da Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyId"
                    type="text"
                    value={companyId}
                    onChange={(e) => { setCompanyId(e.target.value); setServerError(""); }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="pl-9 font-mono text-xs"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Código informado no E-mail de boas-vindas!
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}