
"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {useState} from 'react'

export default function ImageTab() {

    const [activeTab,setactiveTab] = useState("Organize");

  return (
    <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-black mb-6 text-4xl font-bold">Hero Image Section</h2>
              <p className="text-muted-foreground mb-4 text-lg">This is the hero image section with tabs.</p>
            </div>
            {/* Tabs */}
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="outline" onClick={()=>setactiveTab("Organize")} className={`rounded-lg ${activeTab === "Organize" ? "bg-blue-500 text-white" : ""}`}>Organize Application</Button>
              <Button variant="outline" onClick={()=>setactiveTab("Hired")} className={`rounded-lg ${activeTab === "Hired" ? "bg-blue-500 text-white" : ""}`}>Get Hired</Button>
              <Button variant="outline" onClick={()=>setactiveTab("ManageBoard")} className={`rounded-lg ${activeTab === "ManageBoard" ? "bg-blue-500 text-white" : ""}`}>Manage Board</Button>
            </div>
            {/* Hero Image */}
            <div className="relative mx-auto max-w-5xl mt-8 overflow-hidden rounded-lg border border-gray-300 shadow-lg">
              {
                activeTab === "Organize" && (
                  <Image 
                    src="/hero-image.jpg"
                    alt="Organize Application"
                    className="mx-auto rounded-lg shadow-lg"
                    width={1200}
                    height={600}
                  />
                )
              }
              {
                activeTab === "Hired" && (
                  <Image 
                    src="/hero-image.jpg"
                    alt="Get Hired"
                    className="mx-auto rounded-lg shadow-lg"
                    width={1200}
                    height={600}
                  />
                )
              }
              {
                activeTab === "ManageBoard" && (
                  <Image 
                    src="/hero-image.jpg"
                    alt="Manage Board"
                    className="mx-auto rounded-lg shadow-lg"
                    width={1200}
                    height={600}
                  />
                )
              }
            </div>
          </div>
        </section>
  );
}