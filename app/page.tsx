import { Button } from "@/components/ui/button";
import {ArrowRight} from "lucide-react"
import Link from "next/link";

const features = [
  {
    title: "One board for every application",
    description:
      "Each job sits in a column for its stage: saved, applied, screening, interviewing, offer, or closed. Search by company, role or location, and filter by status or work arrangement.",
  },
  {
    title: "Follow-ups that don't slip",
    description:
      "Set a follow-up date and it shows on your dashboard when it's due. Applications with no reply after two weeks are flagged so you can chase them or close them out.",
  },
  {
    title: "A record of what happened",
    description:
      "Every status change is logged with its date, so each application keeps its history and you can see how many of your applications turn into screens, interviews and offers.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1">
        <section className="container mx-auto px-4 py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-black mb-6 text-5xl font-bold sm:text-6xl">Keep your job search in one place</h1>
            <p className="text-muted-foreground mb-4 text-xl">
              Track every application from saved posting to offer, see where things stall, and know when it&apos;s time to follow up.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link href="/sign-up">
            <Button>Start for Free <ArrowRight/></Button>
            </Link>
            <p className="text-sm text-muted-foreground">All you need is an email address.</p>
          </div>
        </section>

        {/* feature section */}
        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-black mb-6 text-4xl font-bold">What it does</h2>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-lg bg-white p-6 shadow-md">
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
