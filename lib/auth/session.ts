import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Validates the session cookie against the database (not just its presence)
 * and returns only the fields the app uses. Memoized per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
});

/**
 * Use at the top of every page and Server Action that touches user data.
 * Server Actions are public POST endpoints, so each one must call this itself.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * For presentation only (navbar, redirecting signed-in users away from the
 * auth pages): a database outage shows the signed-out state instead of
 * breaking public pages. Never use this to authorize access to data.
 */
export async function getOptionalUser(): Promise<SessionUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    // Let Next.js's own control-flow errors (e.g. headers() opting the route
    // into dynamic rendering) propagate.
    unstable_rethrow(error);
    console.error("Session lookup failed", error);
    return null;
  }
}
