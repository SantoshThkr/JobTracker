"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/dist/client/link";

export default function SignIn(){
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
            <Card className=" ">
                <CardHeader className="text-center text-2xl font-bold">
                    <CardTitle className="text-center text-lg font-semibold">
                        Sign In
                    </CardTitle>
                    <CardDescription className="text-center text-sm text-muted-foreground">
                        Sign in to your account
                    </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-4">
                    <form className="space-y-4 p-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="example@gmail.com"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                minLength={8}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                    </form>
                </CardContent>

                <CardFooter className="block text-center text-sm text-muted-foreground">
                    <Button variant="default" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        Sign In
                    </Button>
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="text-indigo-600 hover:text-indigo-500"
                    >
                        Sign Up
                    </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
