import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateApplicationAction } from "@/app/dashboard/actions";
import { ApplicationForm } from "@/components/applications/application-form";
import { toDateInputValue } from "@/lib/applications/format";
import { getApplication } from "@/lib/applications/service";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Edit application · JobTracker",
};

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const application = await getApplication(user.id, id);
  if (!application) notFound();

  const detailHref = `/dashboard/applications/${application.id}`;

  return (
    <main className="container mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <Link href={detailHref} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to {application.company}
      </Link>
      <h1 className="text-2xl font-semibold">Edit application</h1>
      <ApplicationForm
        action={updateApplicationAction.bind(null, application.id)}
        version={application.updatedAt.toISOString()}
        initialValues={{
          company: application.company,
          title: application.title,
          url: application.url,
          location: application.location,
          workMode: application.workMode,
          salary: application.salary,
          appliedAt: toDateInputValue(application.appliedAt),
          nextFollowUpAt: toDateInputValue(application.nextFollowUpAt),
          notes: application.notes,
        }}
        submitLabel="Save changes"
        cancelHref={detailHref}
      />
    </main>
  );
}
