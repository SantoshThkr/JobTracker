// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const signInEmail = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/auth-client", () => ({ signIn: { email: signInEmail } }));

const { SignInForm } = await import("./sign-in-form");

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct horse" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("SignInForm", () => {
  it("signs in with the entered credentials and goes to the dashboard", async () => {
    signInEmail.mockResolvedValue({ data: {}, error: null });
    render(<SignInForm />);

    await act(async () => fillAndSubmit());

    expect(signInEmail).toHaveBeenCalledWith({ email: "alice@example.com", password: "correct horse" });
    expect(router.replace).toHaveBeenCalledWith("/dashboard");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("disables the button while the request is in flight", async () => {
    let finish: (value: unknown) => void = () => {};
    signInEmail.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<SignInForm />);

    act(() => fillAndSubmit());
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Signing In..." }).disabled).toBe(true);

    await act(async () => finish({ data: null, error: { message: "Invalid email or password" } }));
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Sign In" }).disabled).toBe(false);
  });

  it("announces the server's error and stays on the page", async () => {
    signInEmail.mockResolvedValue({ data: null, error: { message: "Invalid email or password" } });
    render(<SignInForm />);

    await act(async () => fillAndSubmit());

    expect(screen.getByRole("alert").textContent).toBe("Invalid email or password");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("explains a network failure", async () => {
    signInEmail.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<SignInForm />);

    await act(async () => fillAndSubmit());

    expect(screen.getByRole("alert").textContent).toContain("Couldn't reach the server");
  });
});
