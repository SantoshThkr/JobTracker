import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { STATUSES, STATUS_LABELS, WORK_MODES, WORK_MODE_LABELS } from "@/lib/applications/constants";
import { hasFilters, type ApplicationFilters } from "@/lib/applications/filters";

// A plain GET form: filters live in the URL, so they survive reloads, can be
// bookmarked, work without JavaScript, and are applied by the database query.
export function Filters({ filters }: { filters: ApplicationFilters }) {
  return (
    <form role="search" action="/dashboard" className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-48 flex-1 gap-1.5">
        <label htmlFor="q" className="text-sm font-medium">
          Search
        </label>
        <Input id="q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Company, role or location" maxLength={100} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <NativeSelect id="status" name="status" defaultValue={filters.status ?? ""}>
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          {STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="mode" className="text-sm font-medium">
          Work arrangement
        </label>
        <NativeSelect id="mode" name="mode" defaultValue={filters.workMode ?? ""}>
          <NativeSelectOption value="">Any</NativeSelectOption>
          {WORK_MODES.map((mode) => (
            <NativeSelectOption key={mode} value={mode}>
              {WORK_MODE_LABELS[mode]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" variant="secondary">
        Apply
      </Button>
      {hasFilters(filters) && (
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          Clear filters
        </Link>
      )}
    </form>
  );
}
