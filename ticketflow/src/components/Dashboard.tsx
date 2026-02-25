import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Ticket as TicketIcon, Clock, CheckCircle, AlertTriangle, UserX, Building2 } from "lucide-react";

const COLORS = [
  "hsl(199, 89%, 48%)",
  "hsl(38, 92%, 50%)",
  "hsl(220, 9%, 60%)",
  "hsl(220, 70%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)",
];

export function Dashboard() {
  const { tickets, companies, selectedCompanyId } = useApp();
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const currentUser = user?.name ?? "";

  const isUser = role === "user" || role === "client";
  // Backend já filtra por usuário quando chamamos /my — exibimos todos os tickets retornados
  const displayTickets = tickets;

  const stats = {
    total: displayTickets.length,
    open: displayTickets.filter(t => t.status === "open").length,
    inProgress: displayTickets.filter(t => t.status === "in_progress").length,
    pending: displayTickets.filter(t => t.status === "pending").length,
    awaitingUser: displayTickets.filter(t => t.status === "awaiting_user").length,
    resolved: displayTickets.filter(t => t.status === "resolved").length,
    cancelled: displayTickets.filter(t => t.status === "cancelled").length,
    unassigned: displayTickets.filter(t => !t.assignedTo).length,
    critical: displayTickets.filter(t => t.priority === "critical").length,
  };

  const pieData = [
    { name: "Abertos", value: stats.open },
    { name: "Em Andamento", value: stats.inProgress },
    { name: "Pendentes", value: stats.pending },
    { name: "Aguardando", value: stats.awaitingUser },
    { name: "Resolvidos", value: stats.resolved },
    { name: "Cancelados", value: stats.cancelled },
  ].filter(d => d.value > 0);

  const areaData = displayTickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.area] = (acc[t.area] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(areaData).map(([name, count]) => ({ name, count }));

  const priorityData = displayTickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});
  const priorityBarData = Object.entries(priorityData).map(([name, count]) => ({
    name: name === "low" ? "Baixa" : name === "medium" ? "Média" : name === "high" ? "Alta" : "Crítica",
    count,
  }));

  const company = companies.find(c => c.id === selectedCompanyId);

  const userStatCards = [
    { label: "Meus Tickets", value: stats.total, icon: TicketIcon, color: "text-primary" },
    { label: "Abertos", value: stats.open + stats.inProgress + stats.pending, icon: AlertTriangle, color: "text-info" },
    { label: "Resolvidos", value: stats.resolved, icon: CheckCircle, color: "text-success" },
  ];

  const adminStatCards = [
    { label: "Total", value: stats.total, icon: TicketIcon, color: "text-primary" },
    { label: "Abertos", value: stats.open, icon: AlertTriangle, color: "text-info" },
    { label: "Em Andamento", value: stats.inProgress, icon: Clock, color: "text-warning" },
    { label: "Sem Responsável", value: stats.unassigned, icon: UserX, color: "text-destructive" },
  ];

  const statCards = isUser ? userStatCards : adminStatCards;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isUser ? "Visão geral dos seus tickets" : "Visão geral dos chamados"}
            {company && !isUser && ` — ${company.name}`}
          </p>
        </div>
      </div>

      <div className={`grid gap-4 ${isUser ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tickets por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.375rem", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isUser ? "Tickets por Prioridade" : "Tickets por Área"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={isUser ? priorityBarData : barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.375rem", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {!isUser && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tickets por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityBarData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.375rem", fontSize: "12px" }} />
                    <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
