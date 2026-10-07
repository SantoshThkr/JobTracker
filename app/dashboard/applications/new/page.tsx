import type { Metadata } from "next";
import Link from "next/link";
import { createApplicationAction } from "@/app/dashboard/actions";
import { ApplicationForm } from "@/components/applications/application-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Add application · JobTracker",
};

export default async function NewApplicationPage() {
  await requireUser();

  return (
    <main className="container mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-semibold">Add application</h1>
      <ApplicationForm
        action={createApplicationAction}
        initialValues={{ status: "saved" }}
        submitLabel="Add application"
        cancelHref="/dashboard"
        showStatus
      />
    </main>
  );
}
