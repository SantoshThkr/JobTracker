import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getOptionalUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign Up · JobTracker",
};

export default async function SignUp() {
  if (await getOptionalUser()) redirect("/dashboard");
  return <SignUpForm />;
}
