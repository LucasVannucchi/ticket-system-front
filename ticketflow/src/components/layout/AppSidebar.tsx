import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Ticket, Plus, FileText, Menu, X, Users, LogOut, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const linksByRole = {
  super_admin: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/tickets/new", label: "Novo Ticket", icon: Plus },
    { to: "/forms", label: "Formulários", icon: FileText },
    { to: "/users", label: "Usuários", icon: Users },
    { to: "/companies", label: "Empresas", icon: Building2 },
  ],
  admin: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/tickets/new", label: "Novo Ticket", icon: Plus },
    { to: "/forms", label: "Formulários", icon: FileText },
    { to: "/users", label: "Usuários", icon: Users },
  ],
  support: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/tickets/new", label: "Novo Ticket", icon: Plus },
    { to: "/forms", label: "Formulários", icon: FileText },
  ],
  user: [
    { to: "/", label: "Meus Tickets", icon: Ticket },
    { to: "/tickets/new", label: "Novo Ticket", icon: Plus },
    { to: "/forms", label: "Formulários", icon: FileText },
  ],
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const role = user?.role ?? "user";
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = linksByRole[role as keyof typeof linksByRole] ?? linksByRole.user;
  const roleCfg = roleConfig[role as keyof typeof roleConfig] ?? roleConfig.user;

  const nav = (
    <nav className="flex flex-col gap-1 p-3 h-full">
      <div className="mb-4 px-3 pt-2">
        <h2 className="text-sm font-bold text-foreground tracking-tight">HelpDesk</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${roleCfg.class}`}>
            {roleCfg.label}
          </Badge>
        </div>
      </div>
      <div className="flex-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-theme",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-border pt-3 px-3 pb-2">
        {user && (
          <div className="mb-2">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 rounded-md p-2 bg-card border border-border shadow-sm lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-60 border-r border-border bg-sidebar transition-transform duration-200 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
