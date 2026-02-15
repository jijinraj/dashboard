import React, { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import { api } from "../lib/api";
import { isValidEmail } from "../lib/validators";

export default function VerifyEmailPage() {
  const nav = useNavigate();

  const [sp] = useSearchParams();
  const initialEmail = (sp.get("email") || "").trim();

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(sp.get("token") || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const emailErr = useMemo(() => {
    if (!email) return "";
    return isValidEmail(email) ? "" : "Enter a valid email.";
  }, [email]);

  async function verify(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const e0 = email.trim().toLowerCase();
    if (!isValidEmail(e0)) return setErr("Please enter a valid email.");
    if (!otp.trim()) return setErr("Please enter the OTP code.");

    setLoading(true);
    try {
      await api("/auth/verify-email", {
        method: "POST",
        body: { email: e0, otp: otp.trim() },
        auth: false,
      });

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

    const e0 = email.trim().toLowerCase();
    if (!isValidEmail(e0)) return setErr("Please enter a valid email.");

    setLoading(true);
    try {
      await api("/auth/resend-verification", {
        method: "POST",
        body: { email: e0 },
        auth: false,
      });
      setMsg("If that email exists, we sent a new verification code.");
    } catch (e2) {
      setErr(e2.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Header
        right={
          <Link className="text-sm text-white/70 hover:text-white" to="/login">
            Back
          </Link>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md">
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Verify your email
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Your backend currently uses an{" "}
              <span className="font-semibold">OTP code</span> flow (not a token
              link). Enter the code you received.
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

            <form onSubmit={verify} className="mt-8 space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                error={emailErr || ""}
              />

              <Input
                label="OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                hint="In DEV_MODE, the OTP is printed in backend logs."
              />

              <div className="grid gap-3">
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Verifying..." : "Verify Email"}
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
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
