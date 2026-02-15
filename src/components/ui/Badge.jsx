import React from "react";

export default function Badge({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80 " +
        className
      }
    >
      {children}
    </span>
  );
}
