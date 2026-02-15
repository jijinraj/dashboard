import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";
import ServersPanel from "../components/ui/ServersPanel";
import UsersPanel from "../components/ui/UsersPanel";

export default function AdminDashboardPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState("servers");

  function logout() {
    clearToken();
    nav("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="border-b border-neutral-900">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">Admin Dashboard</div>
            <div className="text-sm text-neutral-400">
              Servers • Users • Beta approvals • Peers
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("servers")}
            className={`rounded-lg px-3 py-2 text-sm border ${
              tab === "servers"
                ? "bg-white text-black border-white"
                : "border-neutral-800 hover:bg-neutral-900"
            }`}
          >
            VPN Servers
          </button>
          <button
            onClick={() => setTab("users")}
            className={`rounded-lg px-3 py-2 text-sm border ${
              tab === "users"
                ? "bg-white text-black border-white"
                : "border-neutral-800 hover:bg-neutral-900"
            }`}
          >
            Users & Beta
          </button>
        </div>

        <div className="mt-4">
          {tab === "servers" ? <ServersPanel /> : <UsersPanel />}
        </div>
      </div>
    </div>
  );
}
