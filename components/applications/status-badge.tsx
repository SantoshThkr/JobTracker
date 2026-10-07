import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type Status } from "@/lib/applications/constants";
import { cn } from "@/lib/utils";

// Color supports the label, it never replaces it.
const STATUS_STYLES: Record<Status, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  screening: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  interviewing: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  offer: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  withdrawn: "border-border bg-transparent text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <Badge className={cn(STATUS_STYLES[status], className)}>{STATUS_LABELS[status]}</Badge>;
}
