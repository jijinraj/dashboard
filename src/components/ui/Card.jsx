import React from "react";

export default function Card({ children, className = "" }) {
  return (
    <section
      className={
        "rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 " +
        className
      }
    >
      {children}
    </section>
  );
}
