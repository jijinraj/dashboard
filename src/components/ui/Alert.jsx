import React from "react";

export default function Alert({ children, tone = "neutral", className = "" }) {
  const toneCls =
    tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-100"
      : tone === "success"
        ? "border-teal-300/25 bg-teal-300/10 text-white"
        : "border-white/15 bg-white/[0.05] text-white";

  return (
    <div
      role="alert"
      className={[
        "rounded-2xl border p-4 text-sm whitespace-pre-wrap",
        toneCls,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
