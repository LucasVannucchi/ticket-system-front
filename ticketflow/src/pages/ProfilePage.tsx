import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Lock, Phone, Mail, CheckCircle2 } from "lucide-react";
import { updateMyName, updateMyEmail, updateMyPassword, updateMyPhone, decodeJwt, getToken, setToken } from "@/lib/api";
import { roleConfig } from "@/types/domain";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  // Info form
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) return null;

  const roleCfg = roleConfig[user.role] ?? roleConfig.user;

  const handleUpdateName = async () => {
    if (!name.trim()) { toast.error("O nome não pode estar vazio."); return; }
    setLoading("name");
    try {
      await updateMyName(user.id, name.trim());
      toast.success("Nome atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar nome.");
    } finally { setLoading(null); }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) { toast.error("O e-mail não pode estar vazio."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("E-mail inválido."); return; }
    setLoading("email");
    try {
      await updateMyEmail(user.id, email.trim());
      toast.success("E-mail atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar e-mail.");
    } finally { setLoading(null); }
  };

  const handleUpdatePhone = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned && cleaned.length < 10) { toast.error("Telefone inválido (mínimo 10 dígitos)."); return; }
    setLoading("phone");
    try {
      await updateMyPhone(user.id, cleaned);
      toast.success("Telefone atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar telefone.");
    } finally { setLoading(null); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) { toast.error("A nova senha não pode estar vazia."); return; }
    if (newPassword.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres."); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    setLoading("password");
    try {
      await updateMyPassword(user.id, newPassword);
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar senha.");
    } finally { setLoading(null); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <User className="h-5 w-5" /> Meu Perfil
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e credenciais de acesso</p>
      </div>

      {/* Identidade */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Informações da Conta</CardTitle>
              <CardDescription className="text-xs mt-0.5">Dados do seu perfil no sistema</CardDescription>
            </div>
            <Badge variant="outline" className={`text-xs ${roleCfg.class}`}>
              {roleCfg.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Nome completo
            </Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="flex-1"
                disabled={loading === "name"}
              />
              <Button
                size="sm"
                onClick={handleUpdateName}
                disabled={loading === "name" || name === user.name}
                className="gap-1.5 shrink-0"
              >
                {loading === "name" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          </div>

          <Separator />

          {/* E-mail */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> E-mail
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1"
                disabled={loading === "email"}
              />
              <Button
                size="sm"
                onClick={handleUpdateEmail}
                disabled={loading === "email" || email === user.email}
                className="gap-1.5 shrink-0"
              >
                {loading === "email" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Telefone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Telefone
            </Label>
            <div className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="flex-1"
                maxLength={15}
                disabled={loading === "phone"}
              />
              <Button
                size="sm"
                onClick={handleUpdatePhone}
                disabled={loading === "phone" || !phone.trim()}
                className="gap-1.5 shrink-0"
              >
                {loading === "phone" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Senha */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Alterar Senha
          </CardTitle>
          <CardDescription className="text-xs">
            Escolha uma senha forte com pelo menos 8 caracteres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Nova senha</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading === "password"}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Confirmar nova senha</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading === "password"}
              onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">As senhas não coincidem</p>
            )}
          </div>
          <Button
            className="w-full gap-2"
            onClick={handleUpdatePassword}
            disabled={loading === "password" || !newPassword || newPassword !== confirmPassword}
          >
            {loading === "password" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Alterando...</>
            ) : (
              <><Lock className="h-4 w-4" /> Alterar Senha</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info somente leitura */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground text-center">
            ID da conta: <span className="font-mono">{user.id}</span>
            {" · "}
            Empresa: <span className="font-mono">{user.companyId}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
