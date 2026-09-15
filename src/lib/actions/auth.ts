"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  error?: string;
  /** Supabase is set to require email confirmation, so no session was created yet. */
  needsConfirmation?: boolean;
}

export async function signUpCustomer(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName } },
  });
  if (error) return { error: error.message };

  // With email confirmation switched on in Supabase, signUp returns no session. Sending the
  // customer to their appointments here would just bounce them back to the login screen.
  if (!data.session) return { needsConfirmation: true };

  if (input.phone) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ phone: input.phone }).eq("id", user.id);
    }
  }

  redirect("/my-appointments");
}

export async function signInCustomer(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) return { error: error.message };
  redirect("/my-appointments");
}

export async function signInOwner(input: { email: string; password: string }): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Something went wrong. Please try again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    await supabase.auth.signOut();
    return { error: "This account is not set up as the salon owner." };
  }

  redirect("/admin");
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/reset-password`,
  });
  if (error) return { error: error.message };
  return {};
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
