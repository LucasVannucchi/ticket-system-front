import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Ticket, Plus, FileText, Menu, X,
  Users, LogOut, Building2, UserCircle, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

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
    { to: "/tickets", label: "Tickets da Área", icon: Ticket },
    { to: "/tickets/new", label: "Novo Ticket", icon: Plus },
    { to: "/forms", label: "Formulários", icon: FileText },
  ],
  client: [
    { to: "/", label: "Meus Tickets", icon: Ticket },
    { to: "/tickets/new", label: "Novo Ticket", icon: Plus },
  ],
  user: [
    { to: "/", label: "Meus Tickets", icon: Ticket },
    { to: "/tickets/new", label: "Novo Ticket", icon: Plus },
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
    <nav className="flex flex-col gap-1 h-full">
      {/* Logo / Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Ticket className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight leading-none">HelpDesk</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sistema de Chamados</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            link.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(link.to);
          return (
            <Link
              key={`${link.to}-${link.label}`}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{link.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          );
        })}
      </div>

      {/* Footer: User info + actions */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 w-full text-sm transition-colors",
            location.pathname === "/profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate leading-tight">{user?.name}</p>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 mt-0.5 ${roleCfg.class}`}>
              {roleCfg.label}
            </Badge>
          </div>
        </Link>

        <div className="flex items-center gap-1 pt-1">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 text-muted-foreground h-8 text-xs"
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
        </div>
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
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-60 border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
