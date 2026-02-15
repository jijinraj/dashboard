import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";

import { api } from "../lib/api";
import { isValidEmail, passwordError } from "../lib/validators";
import { setTokenPair } from "../lib/auth";

function Tabs({ tab, setTab }) {
  return (
    <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
      <button
        type="button"
        onClick={() => setTab("login")}
        className={[
          "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
          tab === "login"
            ? "bg-white text-black"
            : "text-white/80 hover:bg-white/[0.06]",
        ].join(" ")}
      >
        Log In
      </button>
      <button
        type="button"
        onClick={() => setTab("signup")}
        className={[
          "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
          tab === "signup"
            ? "bg-white text-black"
            : "text-white/80 hover:bg-white/[0.06]",
        ].join(" ")}
      >
        Sign Up
      </button>
    </div>
  );
}

export default function AuthPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState("login");

  // login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // signup form
  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loginEmailErr = useMemo(() => {
    if (!loginEmail) return "";
    return isValidEmail(loginEmail) ? "" : "Enter a valid email.";
  }, [loginEmail]);

  const signupEmailErr = useMemo(() => {
    if (!regEmail) return "";
    return isValidEmail(regEmail) ? "" : "Enter a valid email.";
  }, [regEmail]);

  const signupPwErr = useMemo(() => {
    if (!regPw) return "";
    return passwordError(regPw);
  }, [regPw]);

  function onGoogleContinue() {
    // TODO: Integrate Google Identity Services here (OAuth / One Tap).
    setMsg("Google login coming soon.");
    setErr("");
  }

  function onPasskeyLogin() {
    // TODO: Integrate WebAuthn here (SimpleWebAuthn recommended).
    setMsg("Passkey login coming soon.");
    setErr("");
  }

  async function doLogin(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const email = loginEmail.trim().toLowerCase();
    if (!isValidEmail(email)) return setErr("Please enter a valid email.");
    if (!loginPw) return setErr("Please enter your password.");

    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password: loginPw },
        auth: false,
      });

      // backend returns {access_token, refresh_token}
      setTokenPair({ ...data, email });
      nav("/dashboard");
    } catch (e2) {
      setErr(e2.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function doSignup(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const email = regEmail.trim().toLowerCase();
    const pwErr = passwordError(regPw);

    if (!isValidEmail(email)) return setErr("Please enter a valid email.");
    if (pwErr) return setErr(pwErr);

    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: { email, password: regPw },
        auth: false,
      });

      await api("/auth/send-verification", {
        method: "POST",
        body: { email },
        auth: false,
      });

      // ✅ go to OTP page directly
      nav(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (e2) {
      setErr(e2.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Header
        right={
          <div className="hidden sm:block text-xs text-white/60">
            Minimal logs • No browsing/traffic logs
          </div>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md space-y-4">
          <Tabs tab={tab} setTab={setTab} />

          <Card className="p-6 sm:p-10">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {tab === "login"
                ? "Sign in to create or revoke WireGuard configs."
                : "Sign up to access the dashboard (beta approval may be required)."}
            </p>

            <div className="mt-6 grid gap-3">
              <Button variant="ghost" onClick={onGoogleContinue} type="button">
                Continue with Google
              </Button>
              <Button variant="ghost" onClick={onPasskeyLogin} type="button">
                Use Passkey
              </Button>
            </div>

            <div className="mt-6 h-px bg-white/10" />

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

            {tab === "login" ? (
              <form onSubmit={doLogin} className="mt-6 space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  error={loginEmailErr || ""}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  placeholder="••••••••"
                />

                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Signing in..." : "Log In"}
                </Button>

                <div className="flex items-center justify-between text-xs text-white/60">
                  <Link className="hover:text-white" to="/forgot-password">
                    Forgot password?
                  </Link>
                  <Link className="hover:text-white" to="/verify-email">
                    Verify email
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={doSignup} className="mt-6 space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  error={signupEmailErr || ""}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={regPw}
                  onChange={(e) => setRegPw(e.target.value)}
                  placeholder="At least 8 characters"
                  error={signupPwErr || ""}
                  hint="Minimum 8 characters."
                />

                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>

                <p className="text-xs text-white/55">
                  After signup, you’ll receive an OTP code to verify your email.
                </p>
              </form>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
