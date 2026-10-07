import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ExternalLink } from "lucide-react";
import { changeStatusAction, deleteApplicationAction } from "@/app/dashboard/actions";
import { DeleteApplication } from "@/components/applications/delete-application";
import { StatusBadge } from "@/components/applications/status-badge";
import { StatusForm } from "@/components/applications/status-form";
import { buttonVariants } from "@/components/ui/button";
import { STATUS_LABELS, WORK_MODE_LABELS } from "@/lib/applications/constants";
import { formatDate } from "@/lib/applications/format";
import { getApplication } from "@/lib/applications/service";
import { requireUser } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

// Shared by generateMetadata and the page within one request.
const loadApplication = cache(async (id: string) => {
  const user = await requireUser();
  return getApplication(user.id, id);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const application = await loadApplication((await params).id);
  return { title: application ? `${application.company} · ${application.title} · JobTracker` : "Not found · JobTracker" };
}

export default async function ApplicationPage({ params }: Props) {
  const { id } = await params;
  const application = await loadApplication(id);
  if (!application) notFound();

  const details = [
    { label: "Location", value: application.location },
    { label: "Work arrangement", value: application.workMode && WORK_MODE_LABELS[application.workMode] },
    { label: "Salary", value: application.salary },
    { label: "Applied on", value: application.appliedAt && formatDate(application.appliedAt) },
    { label: "Next follow-up", value: application.nextFollowUpAt && formatDate(application.nextFollowUpAt) },
    { label: "Added", value: formatDate(application.createdAt) },
  ];
  // Newest first.
  const history = [...application.history].reverse();

  return (
    <main className="container mx-auto grid max-w-3xl gap-8 px-4 py-8">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>

      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{application.company}</h1>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-lg text-muted-foreground">{application.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          {application.url && (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={buttonVariants({ variant: "outline" })}
            >
              View job posting
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          <Link href={`/dashboard/applications/${application.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit details
          </Link>
        </div>
      </header>

      <section aria-label="Status" className="rounded-xl border bg-card p-4">
        <StatusForm status={application.status} action={changeStatusAction.bind(null, application.id)} />
      </section>

      <section aria-labelledby="details-heading" className="grid gap-3">
        <h2 id="details-heading" className="text-lg font-semibold">
          Details
        </h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-sm text-muted-foreground">{detail.label}</dt>
              <dd className="text-sm">{detail.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="notes-heading" className="grid gap-3">
        <h2 id="notes-heading" className="text-lg font-semibold">
          Notes
        </h2>
        {application.notes ? (
          <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet. Use Edit details to add some.</p>
        )}
      </section>

      <section aria-labelledby="history-heading" className="grid gap-3">
        <h2 id="history-heading" className="text-lg font-semibold">
          History
        </h2>
        <ol className="grid gap-2 border-l pl-4">
          {history.map((change, index) => (
            <li key={`${change.at.toISOString()}-${index}`} className="text-sm">
              <span>
                {change.from ? (
                  <>
                    Moved from <strong className="font-medium">{STATUS_LABELS[change.from]}</strong> to{" "}
                    <strong className="font-medium">{STATUS_LABELS[change.to]}</strong>
                  </>
                ) : (
                  <>
                    Added as <strong className="font-medium">{STATUS_LABELS[change.to]}</strong>
                  </>
                )}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · <time dateTime={change.at.toISOString()}>{formatDate(change.at)}</time>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="danger-heading" className="grid gap-3 border-t pt-6">
        <h2 id="danger-heading" className="text-sm font-semibold">
          Delete application
        </h2>
        <DeleteApplication action={deleteApplicationAction.bind(null, application.id)} />
      </section>
    </main>
  );
}
