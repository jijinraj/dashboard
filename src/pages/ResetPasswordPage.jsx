import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import { api } from "../lib/api";
import { isValidEmail, passwordError } from "../lib/validators";

export default function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const initialToken = (sp.get("token") || "").trim();
  const initialEmail = (sp.get("email") || "").trim();

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const emailErr = useMemo(() => {
    if (!email) return "";
    return isValidEmail(email) ? "" : "Enter a valid email.";
  }, [email]);

  const pwErr = useMemo(() => {
    if (!pw) return "";
    return passwordError(pw);
  }, [pw]);

  const pw2Err = useMemo(() => {
    if (!pw2) return "";
    return pw2 === pw ? "" : "Passwords do not match.";
  }, [pw2, pw]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const e0 = email.trim().toLowerCase();
    if (!isValidEmail(e0)) return setErr("Please enter a valid email.");
    if (!token.trim()) return setErr("Reset token is required.");
    const pErr = passwordError(pw);
    if (pErr) return setErr(pErr);
    if (pw !== pw2) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { email: e0, token: token.trim(), new_password: pw },
        auth: false,
      });
      setMsg("Password reset successful. You can log in now.");
    } catch (e2) {
      setErr(e2.message || "Reset failed.");
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
              Reset password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Paste your reset token and choose a new password.
            </p>

            {msg && (
              <Alert tone="success" className="mt-6">
                {msg}{" "}
                <Link className="underline hover:opacity-90" to="/auth">
                  Go to login
                </Link>
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

              <Input
                label="Reset token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
              />

              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="At least 8 characters"
                error={pwErr || ""}
              />

              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Repeat password"
                error={pw2Err || ""}
              />

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Resetting..." : "Reset password"}
              </Button>

              <div className="text-xs text-white/60">
                <Link to="/forgot-password" className="hover:text-white">
                  Need a reset token?
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
