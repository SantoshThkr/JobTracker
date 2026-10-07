import { Compass } from "lucide-react";
import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";

const linkClass = "text-gray-300 hover:text-white uppercase";

export default async function NavBar(){
    const user = await getOptionalUser();

    return (
        <nav className="bg-gray-800" aria-label="Main">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
                <div className="text-white text-lg font-semibold flex items-center gap-2">
                    <Link href="/" className="flex gap-2 items-center justify-center">
                        <Compass size={20} color="#3b82f6" aria-hidden="true" />
                        Job Tracker
                    </Link>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {user ? (
                        <>
                            <Link href="/dashboard" className={linkClass}>
                                Dashboard
                            </Link>
                            <SignOutButton className={`${linkClass} cursor-pointer disabled:opacity-60`} />
                        </>
                    ) : (
                        <>
                            <Link href="/sign-in" className={linkClass}>
                                Sign In
                            </Link>
                            <Link href="/sign-up" className={linkClass}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
