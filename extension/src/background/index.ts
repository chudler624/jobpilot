import { requestSignInCode, verifySignInCode, signOut, getSession } from "../lib/auth";
import { fetchCareerProfile } from "../lib/career-profile";
import { registerPostingCapture } from "../lib/capture-posting";
import type { BackgroundRequest, BackgroundResponse } from "../lib/messages";

registerPostingCapture();

// The background service worker is the single owner of the Supabase
// client/session (see src/lib/supabase.ts) — the popup and content
// script never instantiate their own, they only ever message this
// worker. This keeps auth state in exactly one place.
async function handleMessage(message: BackgroundRequest): Promise<BackgroundResponse> {
  switch (message.type) {
    case "GET_SESSION": {
      const session = await getSession();
      return { type: "SESSION", email: session?.user.email ?? null };
    }
    case "REQUEST_CODE": {
      const result = await requestSignInCode(message.email);
      return result.error ? { type: "ERROR", error: result.error } : { type: "OK" };
    }
    case "VERIFY_CODE": {
      const result = await verifySignInCode(message.email, message.code);
      return result.error ? { type: "ERROR", error: result.error } : { type: "OK" };
    }
    case "SIGN_OUT": {
      await signOut();
      return { type: "OK" };
    }
    case "GET_CAREER_PROFILE": {
      const profile = await fetchCareerProfile();
      return { type: "CAREER_PROFILE", profile };
    }
  }
}

chrome.runtime.onMessage.addListener((message: BackgroundRequest, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((err) =>
      sendResponse({ type: "ERROR", error: err instanceof Error ? err.message : "Unknown error" })
    );
  return true; // keep the message channel open for the async response
});
