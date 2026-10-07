"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth/auth-client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const { error } = await signOut();
      if (!error) {
        router.replace("/");
        router.refresh();
        return;
      }
    } catch {
      // Fall through: the session is still active, so let the user retry.
    }
    setPending(false);
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className={className}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
