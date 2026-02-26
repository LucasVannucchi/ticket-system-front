import { useState } from "react";
import { TicketList } from "@/components/TicketList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Download, Loader2, AlertTriangle } from "lucide-react";
import { exportTicketsCsv, getSlaBreachedTickets } from "@/lib/api";
import { mapTicketSummary } from "@/context/AppContext";
import type { Ticket } from "@/types/domain";

export default function TicketsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const isPrivileged = role === "support" || role === "admin" || role === "super_admin";
  const [exporting, setExporting] = useState(false);
  const [showSlaBreached, setShowSlaBreached] = useState(false);
  const [slaBreachedTickets, setSlaBreachedTickets] = useState<Ticket[]>([]);
  const [loadingSla, setLoadingSla] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTicketsCsv();
      toast.success("Exportação iniciada — verifique seus downloads.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao exportar tickets.");
    } finally {
      setExporting(false);
    }
  };

  const handleSlaFilter = async () => {
    if (showSlaBreached) {
      setShowSlaBreached(false);
      return;
    }
    setLoadingSla(true);
    try {
      const res = await getSlaBreachedTickets(0, 100);
      const list = res.content.map(mapTicketSummary);
      setSlaBreachedTickets(list);
      setShowSlaBreached(true);
      if (list.length === 0) {
        toast.success("Nenhum ticket com SLA violado no momento!");
      } else {
        toast.warning(`${list.length} ticket(s) com SLA violado.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao filtrar por SLA.");
    } finally {
      setLoadingSla(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {role === "support" ? "Tickets da Minha Área" : "Todos os Tickets"}
            {showSlaBreached && (
              <Badge variant="destructive" className="text-xs ml-1">SLA Violado</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showSlaBreached
              ? `${slaBreachedTickets.length} ticket(s) com prazo ultrapassado`
              : role === "support"
              ? "Visualize e gerencie os chamados da sua área"
              : "Gerencie todos os chamados do sistema"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isPrivileged && (
            <Button
              variant={showSlaBreached ? "destructive" : "outline"}
              size="sm"
              onClick={handleSlaFilter}
              disabled={loadingSla}
              className="gap-1.5"
            >
              {loadingSla ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {showSlaBreached ? "Limpar Filtro SLA" : "SLA Violado"}
            </Button>
          )}

          {isPrivileged && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="gap-1.5"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      <TicketList overrideTickets={showSlaBreached ? slaBreachedTickets : undefined} />
    </div>
  );
}
