import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CompanySelector } from "@/components/CompanySelector";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user } = useAuth();
  const { companies } = useApp();
  const role = user?.role ?? "user";
  const company = companies.find(c => c.id === user?.companyId);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="lg:hidden w-10" />
      <div className="hidden lg:flex items-center gap-3">
        <h1 className="text-sm font-semibold text-foreground">HelpDesk</h1>
        {company && role !== "super_admin" && (
          <Badge variant="outline" className="text-[10px]">{company.name}</Badge>
        )}
        <CompanySelector />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="hidden sm:block">{user?.name}</span>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
