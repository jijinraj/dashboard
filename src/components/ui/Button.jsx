// src/ui/Button.jsx
export default function Button({
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-teal-300 text-black hover:opacity-90"
      : variant === "ghost"
        ? "border border-white/15 bg-white/[0.02] text-white hover:bg-white/[0.05]"
        : "border border-white/15 bg-black text-white hover:bg-white/[0.05]";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
