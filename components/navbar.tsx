import { Compass } from "lucide-react";
import Link from "next/link";

export default function NavBar(){
    return (
        <nav className="bg-gray-800">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="text-white text-lg font-semibold flex items-center gap-2">
                    <Link href="/" className="flex gap-2 items-center justify-center">
                        <Compass size={20} color="#3b82f6" />
                        Job Tracker
                    </Link>
                </div>
                <div className="space-x-4">
                    <Link href="/dashboard" className="text-gray-300 hover:text-white uppercase">
                        Dashboard
                    </Link>
                    <Link href="/sign-in" className="text-gray-300 hover:text-white uppercase">
                        Sign In
                    </Link>
                    <Link href="/sign-up" className="text-gray-300 hover:text-white uppercase">
                        Sign Up
                    </Link>
                </div>
            </div>
        </nav>
    );
}