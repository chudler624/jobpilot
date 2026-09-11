import { supabase } from "./supabase";

// Email OTP (6-digit code), not a redirect-based flow — simpler and more
// reliable inside an extension than chrome.identity.launchWebAuthFlow,
// and needs zero Supabase redirect-URL configuration. shouldCreateUser is
// false: this signs in to the existing jobpilot account, it never creates
// a new one from a mistyped email.
export async function requestSignInCode(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) return { error: error.message };
  return {};
}

export async function verifySignInCode(
  email: string,
  code: string
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (error) return { error: error.message };
  return {};
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
