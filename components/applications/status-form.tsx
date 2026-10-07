"use client";

import { useActionState } from "react";
import type { StatusFormState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/applications/constants";

const initialState: StatusFormState = {};

export function StatusForm({
  status,
  action,
}: {
  status: Status;
  action: (state: StatusFormState, formData: FormData) => Promise<StatusFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    // Remount when the saved status changes so the select shows it again.
    <form key={status} action={formAction} className="grid gap-2">
      {/* The status this page was showing. The server only applies the change
          if that is still the current status. */}
      <input type="hidden" name="from" value={status} />
      <label htmlFor="to" className="text-sm font-medium">
        Status
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect id="to" name="to" defaultValue={status} disabled={pending} aria-describedby={state.message ? "status-message" : undefined}>
          {STATUSES.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {STATUS_LABELS[option]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Updating…" : "Update status"}
        </Button>
      </div>
      {state.message && (
        <p id="status-message" role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
