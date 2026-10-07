"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function DeleteApplication({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Keep keyboard focus on the safe choice when the confirmation opens, and
  // return it to the trigger when it closes.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (wasConfirming.current) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  if (!confirming) {
    return (
      <Button ref={triggerRef} type="button" variant="destructive" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <form action={action} role="group" aria-labelledby="delete-confirm-text" className="flex flex-wrap items-center gap-2">
      <p id="delete-confirm-text" className="text-sm">
        Delete this application and its history? This can&apos;t be undone.
      </p>
      <ConfirmButton />
      <Button ref={cancelRef} type="button" variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Deleting…" : "Delete permanently"}
    </Button>
  );
}
