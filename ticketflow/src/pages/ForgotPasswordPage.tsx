import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";
import { Mail, Building2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { forgotPassword } from "@/lib/api";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    if (!UUID_REGEX.test(companyId.trim())) {
      setError("O código da empresa deve ser um UUID válido.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim(), companyId.trim());
      setSent(true);
      toast.success("Instruções enviadas por e-mail!");
    } catch (err: any) {
      setError(err?.message || "Erro ao solicitar redefinição de senha.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">E-mail enviado!</h2>
            <p className="text-sm text-muted-foreground">
              Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em breve.
            </p>
            <Button variant="outline" asChild className="w-full mt-2">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Recuperar Senha</h1>
          <p className="text-sm text-muted-foreground">
            Informe seu e-mail e o código da empresa para receber as instruções.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Esqueceu sua senha?</CardTitle>
            <CardDescription className="text-xs">
              Enviaremos um link de redefinição para seu e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="seu@email.com"
                    className="pl-9"
                    required
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
                    onChange={(e) => { setCompanyId(e.target.value); setError(""); }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="pl-9 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar instruções"
                )}
              </Button>

              <Button variant="ghost" asChild className="w-full">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para o login
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
