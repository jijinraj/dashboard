import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../lib/adminApi";
import { setTokenPair } from "../lib/auth";
import { setRole } from "../lib/storage";

export default function AdminLoginPage() {
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
      const res = await adminLogin(email, password);
      setTokenPair({ ...res, email });
      // optional: set a hint role; server is source of truth (403 if not admin)
      setRole("admin");
      nav("/admin");
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 shadow"
      >
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <p className="text-sm text-neutral-400 mt-1">Use an admin account.</p>

        {err && (
          <div className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-red-200 text-sm whitespace-pre-wrap">
            {err}
          </div>
        )}

        <label className="block mt-5 text-sm text-neutral-300">Email</label>
        <input
          className="mt-2 w-full rounded-lg bg-neutral-950 border border-neutral-800 p-3 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="block mt-4 text-sm text-neutral-300">Password</label>
        <input
          className="mt-2 w-full rounded-lg bg-neutral-950 border border-neutral-800 p-3 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />

        <button
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-white text-black font-semibold py-3 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-3 text-xs text-neutral-500">
          If you login but admin pages show 403, that account is not role=admin.
        </p>
      </form>
    </div>
  );
}
