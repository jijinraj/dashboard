import React, { useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import { api } from "../lib/api";
import { isValidEmail } from "../lib/validators";

function Otp6({ value, onChange, disabled }) {
  const inputsRef = useRef([]);

  const digits = useMemo(() => {
    const v = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    return Array.from({ length: 6 }, (_, i) => v[i] || "");
  }, [value]);

  function focusIndex(i) {
    const el = inputsRef.current[i];
    if (el) el.focus();
  }

  function setAt(i, d) {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(""));
  }

  function handleChange(i, e) {
    const raw = e.target.value;
    const cleaned = String(raw).replace(/\D/g, "");

    if (!cleaned) {
      setAt(i, "");
      return;
    }

    // paste/autofill multiple digits into one box
    if (cleaned.length > 1) {
      const base = digits.join("");
      const merged = (base.slice(0, i) + cleaned + base.slice(i + 1))
        .replace(/\D/g, "")
        .slice(0, 6);

      onChange(merged);
      focusIndex(Math.min(5, i + cleaned.length - 1));
      return;
    }

    setAt(i, cleaned[0]);
    if (i < 5) focusIndex(i + 1);
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        setAt(i, "");
        return;
      }
      if (i > 0) {
        focusIndex(i - 1);
        setAt(i - 1, "");
      }
    }
    if (e.key === "ArrowLeft" && i > 0) focusIndex(i - 1);
    if (e.key === "ArrowRight" && i < 5) focusIndex(i + 1);
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    const next = text.slice(0, 6);
    onChange(next);
    focusIndex(Math.min(5, next.length - 1));
  }

  return (
    <div>
      <div className="mb-1 text-xs text-white/70">OTP code</div>
      <div className="flex gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={d}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={2}
            className="h-12 w-12 rounded-xl border border-white/15 bg-white/[0.02] text-center text-lg text-white outline-none transition focus:border-teal-300/60 disabled:opacity-60"
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>
      <div className="mt-1 text-xs text-white/40">
        Tip: paste the full 6 digits.
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const initialEmail = (sp.get("email") || "").trim();

  // email + edit mode
  const [email, setEmail] = useState(initialEmail);
  const [emailEdit, setEmailEdit] = useState(false);
  const [emailDraft, setEmailDraft] = useState(initialEmail);

  // OTP
  const [otp, setOtp] = useState(
    (sp.get("token") || "").replace(/\D/g, "").slice(0, 6),
  );

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const emailErr = useMemo(() => {
    if (!emailDraft) return "";
    const e0 = emailDraft.trim().toLowerCase();
    return isValidEmail(e0) ? "" : "Enter a valid email.";
  }, [emailDraft]);

  async function verify(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!isValidEmail(normalizedEmail)) {
      return setErr("Missing/invalid email. Please sign up again.");
    }

    const code = String(otp || "").replace(/\D/g, "");
    if (code.length !== 6) return setErr("Please enter the 6-digit OTP code.");

    setLoading(true);
    try {
      await api("/auth/verify-email", {
        method: "POST",
        body: { email: normalizedEmail, otp: code },
        auth: false,
      });

      sessionStorage.removeItem("sr_pending_pw");
      sessionStorage.removeItem("sr_pending_email");

      setMsg("Email verified successfully. Redirecting to dashboard...");
      setTimeout(() => nav("/dashboard", { replace: true }), 800);
    } catch (e2) {
      setErr(e2.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setErr("");
    setMsg("");

    if (!isValidEmail(normalizedEmail)) {
      return setErr("Missing/invalid email. Please sign up again.");
    }

    setLoading(true);
    try {
      await api("/auth/resend-verification", {
        method: "POST",
        body: { email: normalizedEmail },
        auth: false,
      });
      setMsg("If that email exists, we sent a new verification code.");
    } catch (e2) {
      setErr(e2.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  function startEditEmail() {
    setErr("");
    setMsg("");
    setEmailDraft(email);
    setEmailEdit(true);
  }

  function cancelEditEmail() {
    setErr("");
    setMsg("");
    setEmailDraft(email);
    setEmailEdit(false);
  }

  async function saveEmailAndResendOtp() {
    setErr("");
    setMsg("");

    const newEmail = emailDraft.trim().toLowerCase();
    if (!isValidEmail(newEmail)) return setErr("Please enter a valid email.");

    if (newEmail === normalizedEmail) {
      setEmailEdit(false);
      setMsg("Email unchanged.");
      return;
    }

    const pw = sessionStorage.getItem("sr_pending_pw") || "";
    if (!pw) {
      return setErr(
        "Signup password not found (session expired). Please go back and sign up again.",
      );
    }

    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: { email: newEmail, password: pw },
        auth: false,
      });

      await api("/auth/send-verification", {
        method: "POST",
        body: { email: newEmail },
        auth: false,
      });

      setEmail(newEmail);
      sessionStorage.setItem("sr_pending_email", newEmail);

      setOtp("");
      setEmailEdit(false);

      setMsg("Updated email. We sent a new OTP to the new address.");
    } catch (e2) {
      setErr(e2.message || "Failed to update email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col">
      <Header
        right={
          <Link className="text-sm text-white/70 hover:text-white" to="/login">
            Back
          </Link>
        }
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 flex items-center">
        <div className="mx-auto w-full max-w-md">
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Verify your email
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Enter the 6-digit code we sent to your inbox.
            </p>

            {msg && (
              <Alert tone="success" className="mt-6">
                {msg}
              </Alert>
            )}
            {err && (
              <Alert tone="error" className="mt-6">
                {err}
              </Alert>
            )}

            {/* EMAIL ALWAYS VISIBLE */}
            <div className="mt-8">
              <Input
                label="Email"
                type="email"
                value={emailEdit ? emailDraft : normalizedEmail}
                onChange={(e) => setEmailDraft(e.target.value)}
                disabled={!emailEdit || loading}
                placeholder="you@example.com"
                error={emailEdit ? emailErr : ""}
              />
            </div>

            {/* EDIT MODE: hide OTP + verify/resend, show save/cancel */}
            {emailEdit ? (
              <>
                <div className="mt-3 text-xs text-white/50">
                  Saving will re-run signup with your original password and send
                  a new OTP.
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Button
                    className="w-full"
                    type="button"
                    disabled={loading || !!emailErr}
                    onClick={saveEmailAndResendOtp}
                  >
                    {loading ? "Saving..." : "Save & resend OTP"}
                  </Button>

                  <Button
                    className="w-full"
                    variant="ghost"
                    type="button"
                    disabled={loading}
                    onClick={cancelEditEmail}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              /* NORMAL MODE: OTP + verify + edit button (between) + resend */
              <form onSubmit={verify} className="mt-8 space-y-4">
                <Otp6 value={otp} onChange={setOtp} disabled={loading} />

                <div className="grid gap-3">
                  <Button className="w-full" disabled={loading} type="submit">
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>

                  <Button
                    className="w-full"
                    variant="ghost"
                    disabled={loading}
                    type="button"
                    onClick={startEditEmail}
                  >
                    Edit email
                  </Button>

                  <Button
                    className="w-full"
                    variant="ghost"
                    disabled={loading}
                    type="button"
                    onClick={resend}
                  >
                    Resend code
                  </Button>
                </div>

                <div className="text-xs text-white/60">
                  <Link to="/login" className="hover:text-white">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
