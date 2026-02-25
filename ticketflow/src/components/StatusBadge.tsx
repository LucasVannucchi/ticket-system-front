import { Status, statusConfig } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 gap-1.5 font-medium border ${cfg.class}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </Badge>
  );
}
