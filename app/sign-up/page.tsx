"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/dist/client/link";
import { set } from "mongoose";
import { signUp } from "@/lib/auth/auth-client";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        const result = await signUp.email({ name, email, password });
        console.log("Sign up successful:", result);
        // Redirect or show success message
        if (result.error) {
            setError(result.error.message || "An error occurred during sign up.");
        }
        else{
            // Redirect to sign-in page or dashboard
            window.location.href = "/dashboard"; 
        }
      } catch (error: any) {
        console.error("Error signing up:", error);
        setError(error.message || "An error occurred during sign up.");
      } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className=" ">
        <CardHeader className="text-center text-2xl font-bold">
          <CardTitle className="text-center text-lg font-semibold">
            Sign Up
          </CardTitle>
          <CardDescription className="text-center text-sm text-muted-foreground">
            Create an account to get started
          </CardDescription>
        </CardHeader>
        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="john"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              />
            </div>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              />
            </div>
          </CardContent>

          <CardFooter className="block text-center text-sm text-muted-foreground">
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
