import { useEffect, useState } from "react";
import type { BackgroundRequest, BackgroundResponse, ContentRequest, ContentResponse, DetectedField } from "../lib/messages";
import type { CareerProfile } from "../lib/career-profile";
import { resolveAnswer, CATEGORY_LABELS, type ResolvedAnswer } from "./answer-lookup";

function sendToBackground(message: BackgroundRequest): Promise<BackgroundResponse> {
  return chrome.runtime.sendMessage(message);
}

async function sendToActiveTab(message: ContentRequest): Promise<ContentResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");

  // Injected on demand only, via activeTab — nothing runs on this page
  // until the user clicks the button that triggers this call.
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["assets/content.js"] });
  return chrome.tabs.sendMessage(tab.id, message);
}

type AuthStep = "checking" | "email" | "code" | "signedIn";

export function Popup() {
  const [authStep, setAuthStep] = useState<AuthStep>("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null);
  const [fields, setFields] = useState<DetectedField[] | null>(null);
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const [detectBusy, setDetectBusy] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  useEffect(() => {
    sendToBackground({ type: "GET_SESSION" }).then((res) => {
      if (res.type === "SESSION" && res.email) {
        setUserEmail(res.email);
        setAuthStep("signedIn");
      } else {
        setAuthStep("email");
      }
    });
  }, []);

  async function handleRequestCode() {
    setAuthError(null);
    setAuthBusy(true);
    const res = await sendToBackground({ type: "REQUEST_CODE", email: emailInput.trim() });
    setAuthBusy(false);
    if (res.type === "ERROR") {
      setAuthError(res.error);
      return;
    }
    setAuthStep("code");
  }

  async function handleVerifyCode() {
    setAuthError(null);
    setAuthBusy(true);
    const res = await sendToBackground({
      type: "VERIFY_CODE",
      email: emailInput.trim(),
      code: codeInput.trim(),
    });
    setAuthBusy(false);
    if (res.type === "ERROR") {
      setAuthError(res.error);
      return;
    }
    setUserEmail(emailInput.trim());
    setAuthStep("signedIn");
  }

  async function handleSignOut() {
    await sendToBackground({ type: "SIGN_OUT" });
    setUserEmail(null);
    setFields(null);
    setCareerProfile(null);
    setAuthStep("email");
  }

  async function handleDetect() {
    setDetectError(null);
    setDetectBusy(true);
    setFilled(new Set());
    try {
      if (!careerProfile) {
        const profileRes = await sendToBackground({ type: "GET_CAREER_PROFILE" });
        if (profileRes.type === "ERROR") throw new Error(profileRes.error);
        if (profileRes.type === "CAREER_PROFILE") setCareerProfile(profileRes.profile);
      }
      const res = await sendToActiveTab({ type: "DETECT_FIELDS" });
      if (res.type === "ERROR") throw new Error(res.error);
      if (res.type === "FIELDS_DETECTED") setFields(res.fields);
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setDetectBusy(false);
    }
  }

  async function handleFill(field: DetectedField, answer: ResolvedAnswer) {
    const res = await sendToActiveTab({ type: "FILL_FIELD", fieldId: field.id, value: answer.fillValue });
    if (res.type === "FILL_DONE") {
      setFilled((prev) => new Set(prev).add(field.id));
    }
  }

  if (authStep === "checking") {
    return (
      <div className="popup">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (authStep === "email" || authStep === "code") {
    return (
      <div className="popup">
        <h1>jobpilot Application Assistant</h1>
        {authStep === "email" ? (
          <>
            <p className="muted">Sign in with your jobpilot account email.</p>
            <input
              type="email"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button className="primary" onClick={handleRequestCode} disabled={authBusy || !emailInput}>
              {authBusy ? "Sending..." : "Send code"}
            </button>
          </>
        ) : (
          <>
            <p className="muted">Enter the 6-digit code emailed to {emailInput}.</p>
            <input
              inputMode="numeric"
              placeholder="123456"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />
            <button className="primary" onClick={handleVerifyCode} disabled={authBusy || !codeInput}>
              {authBusy ? "Verifying..." : "Verify"}
            </button>
          </>
        )}
        {authError && <p className="error">{authError}</p>}
      </div>
    );
  }

  return (
    <div className="popup">
      <h1>jobpilot Application Assistant</h1>
      <div className="muted">
        Signed in as {userEmail} · <button onClick={handleSignOut}>Sign out</button>
      </div>

      <button className="primary" onClick={handleDetect} disabled={detectBusy}>
        {detectBusy ? "Scanning page..." : "Detect fields on this page"}
      </button>
      {detectError && <p className="error">{detectError}</p>}

      {fields && careerProfile && (
        <>
          <p className="muted">
            Detected {fields.length} field{fields.length === 1 ? "" : "s"}. Review each answer, then fill —
            nothing is ever submitted for you.
          </p>
          {fields.length === 0 ? (
            <p className="muted">No recognized fields on this page.</p>
          ) : (
            <ul className="field-list">
              {fields.map((field) => {
                const answer = resolveAnswer(field, careerProfile);
                const isFilled = filled.has(field.id);
                return (
                  <li key={field.id} className="field-item">
                    <span className="field-label">{CATEGORY_LABELS[field.category]}</span>
                    <span className="muted">{field.label}</span>
                    {answer ? (
                      <>
                        <span className="field-answer">Suggested: {answer.display}</span>
                        <button onClick={() => handleFill(field, answer)} disabled={isFilled}>
                          {isFilled ? "Filled" : "Fill"}
                        </button>
                      </>
                    ) : (
                      <span className="field-answer muted">No data found for this field.</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <p className="notice">
        This extension only fills fields you approve — it never clicks submit
        or sends the application. Review everything before you apply.
      </p>
    </div>
  );
}
