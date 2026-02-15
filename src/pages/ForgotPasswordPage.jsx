import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import { api } from "../lib/api";
import { isValidEmail } from "../lib/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const emailErr = useMemo(() => {
    if (!email) return "";
    return isValidEmail(email) ? "" : "Enter a valid email.";
  }, [email]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const e0 = email.trim().toLowerCase();
    if (!isValidEmail(e0)) return setErr("Please enter a valid email.");

    setLoading(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: e0 },
        auth: false,
      });

      // Anti-enumeration message
      setMsg("If the email exists, we sent a password reset link.");
    } catch (e2) {
      // still keep it generic, but show network/server errors if needed
      setMsg("If the email exists, we sent a password reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Header
        right={
          <Link className="text-sm text-white/70 hover:text-white" to="/auth">
            Back
          </Link>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md">
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Forgot password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Enter your email and we’ll send a reset token (in DEV_MODE it
              prints in backend logs).
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

            <form onSubmit={submit} className="mt-8 space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                error={emailErr || ""}
              />

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Sending..." : "Send reset link"}
              </Button>

              <div className="text-xs text-white/60">
                <Link to="/auth" className="hover:text-white">
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
