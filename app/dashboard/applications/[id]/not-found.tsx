import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ApplicationNotFound() {
  return (
    <main className="container mx-auto grid max-w-3xl justify-items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Application not found</h1>
      <p className="text-muted-foreground">It may have been deleted, or the link is wrong.</p>
      <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Back to dashboard
      </Link>
    </main>
  );
}
