import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs text-white/55">
          © {new Date().getFullYear()} SpartaRocket
        </p>
      </div>
    </footer>
  );
}
