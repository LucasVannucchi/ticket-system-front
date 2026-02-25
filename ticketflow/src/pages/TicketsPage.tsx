import { TicketList } from "@/components/TicketList";

export default function TicketsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Todos os Tickets</h1>
        <p className="text-sm text-muted-foreground">Gerencie todos os chamados do sistema</p>
      </div>
      <TicketList />
    </div>
  );
}
