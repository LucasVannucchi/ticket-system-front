import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { priorityConfig, statusConfig, type Status } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { CommentSection } from "@/components/CommentSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, User, Building2, FileText, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Ticket } from "@/lib/mock-data";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function TicketView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateTicketStatus, assignTicket, assignableUsers, getTicketFull } = useApp();
  const { user } = useAuth();
  const role = user?.role ?? "user";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingTicket(true);
    getTicketFull(id)
      .then(setTicket)
      .catch(() => toast.error("Erro ao carregar ticket."))
      .finally(() => setLoadingTicket(false));
  }, [id]);

  if (loadingTicket) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ticket não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const priority = priorityConfig[ticket.priority];
  const canManage = role === "admin" || role === "super_admin" || role === "support";

  const handleStatusChange = async (status: Status) => {
    setUpdating(true);
    try {
      await updateTicketStatus(ticket.id, status);
      setTicket((prev) => prev ? { ...prev, status } : prev);
      toast.success("Status atualizado.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (userId: string) => {
    const user = assignableUsers.find((u) => u.id === userId);
    if (!user) return;
    setUpdating(true);
    try {
      await assignTicket(ticket.id, user.id, user.name);
      setTicket((prev) => prev ? { ...prev, assignedTo: user.name } : prev);
      toast.success("Ticket atribuído.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atribuir ticket.");
    } finally {
      setUpdating(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${priority.class}`}>
              {priority.label}
            </Badge>
            <StatusBadge status={ticket.status} />
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ticket.area}</Badge>
          </div>
          <CardTitle className="text-lg">{ticket.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{ticket.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ticket.createdBy}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(ticket.createdAt)}</span>
            {ticket.assignedTo && (
              <span className="text-primary">Responsável: {ticket.assignedTo}</span>
            )}
          </div>

          {canManage && (
            <>
              <Separator />
              {updating && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Atualizando...
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-medium">Status</label>
                  <Select
                    value={ticket.status}
                    onValueChange={(v) => handleStatusChange(v as Status)}
                    disabled={updating}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-medium">Responsável</label>
                  <Select
                    value={assignableUsers.find((u) => u.name === ticket.assignedTo)?.id || ""}
                    onValueChange={handleAssign}
                    disabled={updating}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {ticket.history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" /> Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticket.history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{formatDate(h.createdAt)}</span>
                  <span className="text-foreground">{h.action}</span>
                  <span className="text-muted-foreground">por {h.by}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardContent className="pt-6">
          <CommentSection
            ticketId={ticket.id}
            comments={ticket.comments}
            ticketCreatedBy={ticket.createdBy}
          />
        </CardContent>
      </Card>
    </div>
  );
}
