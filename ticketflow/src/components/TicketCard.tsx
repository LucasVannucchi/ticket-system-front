import { Ticket, priorityConfig } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Clock, User, MessageSquare } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const priority = priorityConfig[ticket.priority];

  return (
    <Link to={`/tickets/${ticket.id}`}>
      <Card className="p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20 cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">{ticket.id}</span>
              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${priority.class}`}>
                {priority.label}
              </Badge>
              <StatusBadge status={ticket.status} />
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ticket.area}</Badge>
            </div>
            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {ticket.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.createdBy}</span>
          {ticket.assignedTo && <span className="text-primary/80">→ {ticket.assignedTo}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(ticket.createdAt)}</span>
          {ticket.comments.length > 0 && (
            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{ticket.comments.length}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
