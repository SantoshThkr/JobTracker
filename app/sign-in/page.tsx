import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getOptionalUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign In · JobTracker",
};

export default async function SignIn() {
  if (await getOptionalUser()) redirect("/dashboard");
  return <SignInForm />;
}
