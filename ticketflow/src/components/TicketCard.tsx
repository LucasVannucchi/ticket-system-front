import { Ticket, priorityConfig } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Clock, User, MessageSquare, AlertTriangle, Flame } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const SLA_BORDER: Record<string, string> = {
  AT_RISK: "border-l-4 border-l-orange-500",
  BREACHED: "border-l-4 border-l-red-600",
};

const SLA_ICON: Record<string, React.ReactNode> = {
  AT_RISK: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" title="SLA em risco" />,
  BREACHED: <Flame className="h-3.5 w-3.5 text-red-600" title="SLA violado" />,
};

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const priority = priorityConfig[ticket.priority];
  const slaBorder = SLA_BORDER[ticket.slaStatus ?? ""] ?? "";
  const slaIcon = SLA_ICON[ticket.slaStatus ?? ""];

  return (
    <Link to={`/tickets/${ticket.id}`}>
      <Card className={`p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20 cursor-pointer group ${slaBorder}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">{ticket.id.slice(0, 8)}…</span>
              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${priority.class}`}>
                {priority.label}
              </Badge>
              <StatusBadge status={ticket.status} />
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ticket.area}</Badge>
              {slaIcon}
            </div>
            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {ticket.title}
            </h3>
            {ticket.category && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.category}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.createdBy}</span>
          {ticket.assignedTo && <span className="text-primary/80">→ {ticket.assignedTo}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(ticket.createdAt)}</span>
          {ticket.comments.length > 0 && (
            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{ticket.comments.length}</span>
          )}
          {ticket.slaStatus === "BREACHED" && (
            <span className="text-red-600 font-medium">⚠ SLA Violado</span>
          )}
          {ticket.slaStatus === "AT_RISK" && (
            <span className="text-orange-500 font-medium">⚡ SLA em Risco</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
