"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import type { ApplicationFormState } from "@/app/dashboard/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_FIELDS,
  STATUSES,
  STATUS_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
  type ApplicationField,
} from "@/lib/applications/constants";

type FormValues = Partial<Record<ApplicationField, string>>;

type ApplicationFormProps = {
  action: (state: ApplicationFormState, formData: FormData) => Promise<ApplicationFormState>;
  initialValues?: FormValues;
  // The updatedAt the form was rendered from; lets the server reject stale edits.
  version?: string;
  submitLabel: string;
  cancelHref: string;
  showStatus?: boolean;
};

const initialState: ApplicationFormState = {};

export function ApplicationForm({
  action,
  initialValues = {},
  version,
  submitLabel,
  cancelHref,
  showStatus = false,
}: ApplicationFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};

  // Send keyboard and screen reader users straight to the first problem.
  useEffect(() => {
    const firstInvalid = APPLICATION_FIELDS.find((field) => state.fieldErrors?.[field]);
    if (firstInvalid) formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
  }, [state]);

  function fieldProps(name: ApplicationField) {
    const error = errors[name];
    return {
      id: name,
      name,
      defaultValue: values[name] ?? "",
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${name}-error` : undefined,
    };
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-6">
      {version && <input type="hidden" name="version" value={version} />}

      {state.message && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p>{state.message}</p>
          {state.duplicateId && (
            <Link href={`/dashboard/applications/${state.duplicateId}`} className="mt-1 inline-block font-medium underline underline-offset-4">
              Open the existing application
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Company" name="company" error={errors.company} required>
          <Input {...fieldProps("company")} required maxLength={120} autoComplete="organization" />
        </FormField>
        <FormField label="Role" name="title" error={errors.title} required>
          <Input {...fieldProps("title")} required maxLength={120} autoComplete="off" />
        </FormField>
      </div>

      <FormField label="Job posting link" name="url" error={errors.url} hint="Used to warn you if you add the same posting twice.">
        <Input {...fieldProps("url")} type="url" inputMode="url" maxLength={2048} placeholder="https://" autoComplete="off" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Location" name="location" error={errors.location}>
          <Input {...fieldProps("location")} maxLength={120} placeholder="e.g. Berlin" />
        </FormField>
        <FormField label="Work arrangement" name="workMode" error={errors.workMode}>
          <NativeSelect {...fieldProps("workMode")} className="w-full">
            <NativeSelectOption value="">Not specified</NativeSelectOption>
            {WORK_MODES.map((mode) => (
              <NativeSelectOption key={mode} value={mode}>
                {WORK_MODE_LABELS[mode]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Salary" name="salary" error={errors.salary}>
          <Input {...fieldProps("salary")} maxLength={100} placeholder="e.g. €80–95k" />
        </FormField>
      </div>

      <div className={showStatus ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
        {showStatus && (
          <FormField label="Status" name="status" error={errors.status}>
            <NativeSelect {...fieldProps("status")} className="w-full">
              {STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {STATUS_LABELS[status]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
        )}
        <FormField
          label="Applied on"
          name="appliedAt"
          error={errors.appliedAt}
          hint="Filled in automatically the first time it moves to Applied or later."
        >
          <Input {...fieldProps("appliedAt")} type="date" />
        </FormField>
        <FormField label="Next follow-up" name="nextFollowUpAt" error={errors.nextFollowUpAt} hint="Shows on your dashboard once it's due.">
          <Input {...fieldProps("nextFollowUpAt")} type="date" />
        </FormField>
      </div>

      <FormField label="Notes" name="notes" error={errors.notes}>
        <Textarea {...fieldProps("notes")} rows={6} maxLength={5000} placeholder="Contacts, interview prep, impressions…" />
      </FormField>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function FormField({
  label,
  name,
  error,
  hint,
  required = false,
  children,
}: {
  label: string;
  name: ApplicationField;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required && (
          <span className="text-muted-foreground" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
