import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";

import { api } from "../lib/api";
import { isValidEmail, passwordError } from "../lib/validators";
import { setTokenPair, clearToken } from "../lib/auth";

function Tabs({ tab, setTab }) {
  return (
    <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur">
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

function pad2(n) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(ss)}`;
}

function useUkEtaTo20() {
  const [etaMs, setEtaMs] = useState(0);
  const [targetLabel, setTargetLabel] = useState("");
  const [nowLabel, setNowLabel] = useState("");

  useEffect(() => {
    const tz = "Europe/London";
    const fmtParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const fmtNow = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    function getUkParts(d) {
      const parts = fmtParts.formatToParts(d);
      const get = (type) => parts.find((p) => p.type === type)?.value;
      return {
        year: Number(get("year")),
        month: Number(get("month")),
        day: Number(get("day")),
        hour: Number(get("hour")),
        minute: Number(get("minute")),
        second: Number(get("second")),
      };
    }

    // Convert UK-local parts -> absolute Date (good enough for UI)
    function ukPartsToAbs(parts) {
      let guess = new Date(
        Date.UTC(
          parts.year,
          parts.month - 1,
          parts.day,
          parts.hour,
          parts.minute,
          parts.second,
        ),
      );

      const observed = getUkParts(guess);

      const desiredUtcLike = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      );
      const observedUtcLike = Date.UTC(
        observed.year,
        observed.month - 1,
        observed.day,
        observed.hour,
        observed.minute,
        observed.second,
      );

      const delta = desiredUtcLike - observedUtcLike;
      return new Date(guess.getTime() + delta);
    }

    function tick() {
      const now = new Date();
      const uk = getUkParts(now);

      setNowLabel(`${fmtNow.format(now)} (Europe/London)`);

      let targetUk = {
        year: uk.year,
        month: uk.month,
        day: uk.day,
        hour: 20,
        minute: 0,
        second: 0,
      };

      const nowSeconds = uk.hour * 3600 + uk.minute * 60 + uk.second;
      const targetSeconds = 20 * 3600;

      if (nowSeconds >= targetSeconds) {
        const tmpAbs = ukPartsToAbs(targetUk);
        const tomorrow = new Date(tmpAbs.getTime() + 24 * 3600 * 1000);
        const tUk = getUkParts(tomorrow);
        targetUk = {
          year: tUk.year,
          month: tUk.month,
          day: tUk.day,
          hour: 20,
          minute: 0,
          second: 0,
        };
      }

      const targetAbs = ukPartsToAbs(targetUk);
      setEtaMs(targetAbs.getTime() - now.getTime());

      const labelFmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setTargetLabel(`${labelFmt.format(targetAbs)} (UK)`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { etaText: formatHMS(etaMs), targetLabel, nowLabel };
}

export default function AuthPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [betaBlocked, setBetaBlocked] = useState(false);
  const [betaMsg, setBetaMsg] = useState("");

  const { etaText, targetLabel, nowLabel } = useUkEtaTo20();

  function isBetaApprovalError(e) {
    const m = String(e?.message || "").toLowerCase();
    return m.includes("not approved for beta");
  }

  function resetAuthUi() {
    setBetaBlocked(false);
    setBetaMsg("");
    setErr("");
    setMsg("");
    setLoading(false);
    setTab("login");
  }

  function logoutFromBetaScreen() {
    clearToken();
    resetAuthUi();
    nav("/auth", { replace: true });
  }

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
    setMsg("Google login coming soon.");
    setErr("");
  }

  function onPasskeyLogin() {
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

      setTokenPair({ ...data, email });
      nav("/dashboard");
    } catch (e2) {
      if (isBetaApprovalError(e2)) {
        setBetaBlocked(true);
        setBetaMsg(e2.message || "Not approved for beta yet.");
        setErr("");
        setMsg("");
        return;
      }
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

      sessionStorage.setItem("sr_pending_pw", regPw);
      sessionStorage.setItem("sr_pending_email", email);

      nav(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (e2) {
      if (isBetaApprovalError(e2)) {
        setBetaBlocked(true);
        setBetaMsg(e2.message || "Not approved for beta yet.");
        setErr("");
        setMsg("");
        return;
      }
      setErr(e2.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col relative overflow-hidden">
      {/* CSS-only animated blobs + subtle noise — no Tailwind arbitrary classes */}
      <style>{`
        @keyframes srFloatA { 0%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(70px,-55px,0) scale(1.08)} 100%{transform:translate3d(0,0,0) scale(1)} }
        @keyframes srFloatB { 0%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(-70px,60px,0) scale(1.10)} 100%{transform:translate3d(0,0,0) scale(1)} }
        @keyframes srFloatC { 0%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(45px,35px,0) scale(1.06)} 100%{transform:translate3d(0,0,0) scale(1)} }
        .sr-noise {
          background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
          background-size: 22px 22px;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-44 h-[22rem] w-[22rem] sm:-top-52 sm:-left-56 sm:h-[40rem] sm:w-[40rem] rounded-full blur-3xl"
          style={{
            background: "rgba(45, 212, 191, 0.18)",
            animation: "srFloatA 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-44 -right-44 h-[24rem] w-[24rem] sm:-bottom-56 sm:-right-56 sm:h-[44rem] sm:w-[44rem] rounded-full blur-3xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            animation: "srFloatB 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-1/3 -right-32 h-[18rem] w-[18rem] sm:-right-44 sm:h-[28rem] sm:w-[28rem] rounded-full blur-3xl"
          style={{
            background: "rgba(45, 212, 191, 0.12)",
            animation: "srFloatC 16s ease-in-out infinite",
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent 55%, transparent)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.14] sr-noise" />
      </div>

      <Header
        right={
          <div className="hidden sm:block text-xs text-white/60">
            Minimal logs • No browsing/traffic logs
          </div>
        }
      />

      <main className="relative flex-1 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 flex items-center">
        <div className="mx-auto w-full max-w-md space-y-4">
          {betaBlocked ? (
            <Card className="relative overflow-hidden p-6 sm:p-10 border border-white/10 bg-white/[0.04] backdrop-blur-xl">
              <div className="relative">
                {/* pulse header */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300/70 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-300" />
                  </span>
                  SpartaRocket Beta queue
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                  You’re at the right place but at the wrong time. ✨
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Your account isn’t beta-approved yet. Once approved, you’ll be
                  able to create and manage configs.
                </p>

                {/* time + eta + next window */}
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-white/55">Time now</div>
                      <div className="font-mono text-sm text-white/90">
                        {nowLabel || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-white/55">ETA</div>
                        <div className="mt-1 font-mono text-lg text-white">
                          {etaText}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/55">
                          Next approval window
                        </div>
                        <div className="mt-1 text-sm text-white/90">
                          {targetLabel || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/45">
                      (Approvals usually happen around 20:00 UK time.)
                    </div>
                  </div>

                  {betaMsg ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80 whitespace-pre-wrap backdrop-blur">
                      {betaMsg}
                    </div>
                  ) : null}
                </div>

                <div className="mt-7 grid gap-3">
                  <Button
                    className="w-full"
                    type="button"
                    onClick={logoutFromBetaScreen}
                  >
                    Logout
                  </Button>
                  <div className="text-center text-xs text-white/55">
                    This takes you back to login/signup.
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Tabs tab={tab} setTab={setTab} />

              <Card className="p-6 sm:p-10 border border-white/10 bg-white/[0.04] backdrop-blur-xl">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {tab === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {tab === "login"
                    ? "Sign in to create or revoke WireGuard configs."
                    : "Sign up to access the dashboard (beta approval may be required)."}
                </p>

                <div className="mt-6 grid gap-3">
                  <Button
                    variant="ghost"
                    onClick={onGoogleContinue}
                    type="button"
                  >
                    Continue with Google
                  </Button>

                  {tab === "login" && (
                    <Button
                      variant="ghost"
                      onClick={onPasskeyLogin}
                      type="button"
                    >
                      Use Passkey
                    </Button>
                  )}
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
                      After signup, you’ll receive an OTP code to verify your
                      email.
                    </p>
                  </form>
                )}
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
