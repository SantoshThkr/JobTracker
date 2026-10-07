// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApplicationFormState } from "@/app/dashboard/actions";
import { ApplicationForm } from "./application-form";
import { DeleteApplication } from "./delete-application";

afterEach(cleanup);

function renderForm(action: (state: ApplicationFormState, formData: FormData) => Promise<ApplicationFormState>) {
  return render(<ApplicationForm action={action} submitLabel="Add application" cancelHref="/dashboard" showStatus />);
}

function fillRequired(company: string, role: string) {
  fireEvent.change(screen.getByLabelText(/Company/), { target: { value: company } });
  fireEvent.change(screen.getByLabelText(/Role/), { target: { value: role } });
}

async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Add application" }));
  });
}

describe("ApplicationForm", () => {
  it("submits the entered values", async () => {
    const action = vi.fn(async (): Promise<ApplicationFormState> => ({}));
    renderForm(action);

    fillRequired("Acme", "Engineer");
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "applied" } });
    await submit();

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("company")).toBe("Acme");
    expect(formData.get("title")).toBe("Engineer");
    expect(formData.get("status")).toBe("applied");
  });

  // Whitespace passes the browser's `required` check but not the server's
  // trimming validation, so this is a real path to server-side field errors.
  it("ties server errors to their fields, focuses the first one and keeps the input", async () => {
    const action = vi.fn(
      async (): Promise<ApplicationFormState> => ({
        fieldErrors: { title: "Role is required.", url: "Job link must start with http:// or https://." },
        values: { company: "Acme", title: "   ", url: "acme.com/jobs" },
      })
    );
    renderForm(action);
    fillRequired("Acme", "   ");
    await submit();
    await screen.findByText("Role is required.");

    const role = screen.getByLabelText(/Role/);
    expect(role.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(role.getAttribute("aria-describedby")!)?.textContent).toBe("Role is required.");
    expect(document.activeElement).toBe(role);

    const link = screen.getByLabelText("Job posting link") as HTMLInputElement;
    expect(link.getAttribute("aria-invalid")).toBe("true");
    expect(link.value).toBe("acme.com/jobs");
    expect((screen.getByLabelText(/Company/) as HTMLInputElement).value).toBe("Acme");
  });

  it("announces form-level errors and links to an existing duplicate", async () => {
    const action = vi.fn(
      async (): Promise<ApplicationFormState> => ({
        message: "You're already tracking this job posting.",
        duplicateId: "abc123",
        values: { company: "Acme", title: "Engineer" },
      })
    );
    renderForm(action);
    fillRequired("Acme", "Engineer");
    await submit();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("You're already tracking this job posting.");
    expect(screen.getByRole("link", { name: "Open the existing application" }).getAttribute("href")).toBe(
      "/dashboard/applications/abc123"
    );
  });
});

describe("DeleteApplication", () => {
  it("asks for confirmation and moves focus to the safe choice", () => {
    const action = vi.fn(async () => {});
    render(<DeleteApplication action={action} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(document.activeElement).toBe(cancel);
    expect(screen.getByRole("button", { name: "Delete permanently" })).toBeTruthy();
    expect(action).not.toHaveBeenCalled();

    fireEvent.click(cancel);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete" }));
  });
});
