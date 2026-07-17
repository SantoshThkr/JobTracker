import { Button } from "@/components/ui/button";
import {ArrowRight} from "lucide-react"
import Link from "next/link";
import ImageTab from "@/components/image-tab";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1">
        <section className="container mx-auto px-4 py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-black mb-6 text-6xl font-bold">Here is the Header </h1>
            <p className="text-muted-foreground mb-4 text-xl">here is the paragraph</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link href="/sign-up">
            <Button>Start for Free <ArrowRight/></Button>
            </Link>
            <p>No money required</p>
          </div>
        </section>
        {/* Hero image section with tabs */}
        <ImageTab/>
        
        {/* feature section */}
        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-black mb-6 text-4xl font-bold">Feature Section</h2>
              <p className="text-muted-foreground mb-4 text-lg">This is the feature section.</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-semibold">Feature 1</h3>
                <p className="text-muted-foreground">Description of feature 1.</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-semibold">Feature 2</h3>
                <p className="text-muted-foreground">Description of feature 2.</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-semibold">Feature 3</h3>
                <p className="text-muted-foreground">Description of feature 3.</p>
              </div>
            </div>
          </div>
        </section>
  
      </main> 
    </div>
  );
}
