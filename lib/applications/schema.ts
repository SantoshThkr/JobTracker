import * as z from "zod";
import {
  APPLICATION_FIELDS,
  STATUSES,
  WORK_MODES,
  type ApplicationField,
  type FieldErrors,
  type Status,
  type WorkMode,
} from "./constants";
import { parseHttpUrl } from "./url";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function requiredText(label: string, max: number) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(max, { error: `${label} must be ${max} characters or fewer.` });
}

// Blank optional inputs become undefined so they are cleared rather than
// stored as empty strings.
function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: `${label} must be ${max} characters or fewer.` })
    .optional()
    .transform((value) => (value ? value : undefined));
}

// <input type="date"> submits YYYY-MM-DD with no time zone. Dates are stored
// as midnight UTC and always displayed in UTC so the day never shifts.
function optionalDate(label: string) {
  return z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const date = new Date(`${value}T00:00:00.000Z`);
      if (!DATE_ONLY.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        ctx.addIssue({ code: "custom", message: `${label} must be a valid date.` });
        return z.NEVER;
      }
      return date;
    });
}

const applicationFields = {
  company: requiredText("Company", 120),
  title: requiredText("Role", 120),
  url: z
    .string()
    .trim()
    .max(2048, { error: "Job link must be 2048 characters or fewer." })
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const url = parseHttpUrl(value);
      if (!url) {
        ctx.addIssue({ code: "custom", message: "Job link must start with http:// or https://." });
        return z.NEVER;
      }
      return url.href;
    }),
  location: optionalText("Location", 120),
  workMode: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(WORK_MODES, { error: "Choose a valid work arrangement." }).optional()
  ),
  salary: optionalText("Salary", 100),
  appliedAt: optionalDate("Applied date"),
  nextFollowUpAt: optionalDate("Follow-up date"),
  notes: optionalText("Notes", 5000),
};

function rejectFutureAppliedDate(value: { appliedAt?: Date }, ctx: z.RefinementCtx) {
  // One day of slack absorbs the gap between the user's local date and UTC.
  const latest = Date.now() + 24 * 60 * 60 * 1000;
  if (value.appliedAt && value.appliedAt.getTime() > latest) {
    ctx.addIssue({ code: "custom", path: ["appliedAt"], message: "Applied date can't be in the future." });
  }
}

export const applicationInputSchema = z.object(applicationFields).superRefine(rejectFutureAppliedDate);

export const newApplicationSchema = z
  .object({
    ...applicationFields,
    status: z.enum(STATUSES, { error: "Choose a valid status." }).default("saved"),
  })
  .superRefine(rejectFutureAppliedDate);

export type ApplicationInput = {
  company: string;
  title: string;
  url?: string;
  location?: string;
  workMode?: WorkMode;
  salary?: string;
  appliedAt?: Date;
  nextFollowUpAt?: Date;
  notes?: string;
};

export type NewApplicationInput = ApplicationInput & { status: Status };

/** Reads the known application fields from a form submission as strings. */
export function readApplicationForm(formData: FormData): Partial<Record<ApplicationField, string>> {
  const values: Partial<Record<ApplicationField, string>> = {};
  for (const field of APPLICATION_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}

/** Keeps the first message per field, which is what the form displays. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && (APPLICATION_FIELDS as readonly string[]).includes(field)) {
      errors[field as ApplicationField] ??= issue.message;
    }
  }
  return errors;
}
