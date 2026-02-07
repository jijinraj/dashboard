import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

export default function LoginPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      setToken(data.token);
      nav("/dashboard");
    } catch (e) {
      setErr(
        typeof e?.message === "string" && e.message
          ? e.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:outline-none focus:ring-2 focus:ring-white/60"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="h-9 w-9 rounded-full border border-white/15 bg-white/[0.04] overflow-hidden"
            >
              <img
                src="https://static.vecteezy.com/system/resources/thumbnails/046/449/142/small/plaster-statue-of-davids-head-isolated-ancient-greek-hero-sculpture-png.png"
                alt=""
              />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">
                SpartaRocket 🚀
              </div>
              <div className="text-xs text-white/60">User dashboard login</div>
            </div>
          </div>

          <div className="hidden sm:block text-xs text-white/60">
            Minimal logs • No browsing/traffic logs
          </div>
        </div>
      </header>

      {/* Body */}
      <main id="main" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Login
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Sign in to create or revoke WireGuard configs.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-2 w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/30"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/30"
                  placeholder="••••••••"
                />
              </div>

              {err && (
                <div
                  role="alert"
                  className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 text-sm text-white"
                >
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              <p className="text-xs text-white/55">
                Your WireGuard private key is generated on your device when you
                create a config.
              </p>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} SpartaRocket
          </p>
        </div>
      </footer>
    </div>
  );
}
