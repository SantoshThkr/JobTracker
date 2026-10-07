"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isStatus, type ApplicationField, type FieldErrors } from "@/lib/applications/constants";
import {
  applicationInputSchema,
  newApplicationSchema,
  readApplicationForm,
  toFieldErrors,
} from "@/lib/applications/schema";
import {
  ApplicationNotFoundError,
  DuplicateApplicationError,
  StaleApplicationError,
  changeStatus,
  createApplication,
  deleteApplication,
  updateApplication,
} from "@/lib/applications/service";
import { requireUser } from "@/lib/auth/session";

// Every action re-checks the session: Server Actions are reachable by direct
// POST, so the page that rendered the form proves nothing. Application ids
// arrive from the client and are only ever used together with the user's id.

export type ApplicationFormState = {
  message?: string;
  fieldErrors?: FieldErrors;
  // Echoed back so a rejected submission keeps what the user typed.
  values?: Partial<Record<ApplicationField, string>>;
  duplicateId?: string;
};

export type StatusFormState = { message?: string };

const GENERIC_ERROR = "Something went wrong while saving. Please try again.";

function duplicateState(error: DuplicateApplicationError, values: ApplicationFormState["values"]): ApplicationFormState {
  return {
    message: "You're already tracking this job posting.",
    fieldErrors: { url: "This link is already on your board." },
    duplicateId: error.existingId,
    values,
  };
}

export async function createApplicationAction(
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const user = await requireUser();
  const values = readApplicationForm(formData);
  const parsed = newApplicationSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  let id: string;
  try {
    id = await createApplication(user.id, parsed.data);
  } catch (error) {
    if (error instanceof DuplicateApplicationError) return duplicateState(error, values);
    console.error("Creating application failed", error);
    return { message: GENERIC_ERROR, values };
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/applications/${id}`);
}

export async function updateApplicationAction(
  id: string,
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const user = await requireUser();
  const values = readApplicationForm(formData);
  const parsed = applicationInputSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const version = new Date(String(formData.get("version") ?? ""));
  if (Number.isNaN(version.getTime())) return { message: GENERIC_ERROR, values };

  try {
    await updateApplication(user.id, id, parsed.data, version);
  } catch (error) {
    if (error instanceof DuplicateApplicationError) return duplicateState(error, values);
    if (error instanceof StaleApplicationError) {
      return {
        message:
          "This application was changed in another tab or window since you opened it. Reload the page to see the latest version, then reapply your edits.",
        values,
      };
    }
    if (error instanceof ApplicationNotFoundError) redirect("/dashboard");
    console.error("Updating application failed", error);
    return { message: GENERIC_ERROR, values };
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/applications/${id}`);
}

export async function changeStatusAction(
  id: string,
  _prev: StatusFormState,
  formData: FormData
): Promise<StatusFormState> {
  const user = await requireUser();
  const from = formData.get("from");
  const to = formData.get("to");
  if (!isStatus(from) || !isStatus(to)) return { message: "Choose a valid status." };

  try {
    await changeStatus(user.id, id, from, to);
  } catch (error) {
    if (error instanceof StaleApplicationError) {
      revalidatePath("/dashboard", "layout");
      return { message: "The status was changed somewhere else. The page now shows the current status; try again if needed." };
    }
    if (error instanceof ApplicationNotFoundError) redirect("/dashboard");
    console.error("Changing application status failed", error);
    return { message: GENERIC_ERROR };
  }

  revalidatePath("/dashboard", "layout");
  return {};
}

export async function deleteApplicationAction(id: string): Promise<void> {
  const user = await requireUser();
  // Deleting something that's already gone is treated as success.
  await deleteApplication(user.id, id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
