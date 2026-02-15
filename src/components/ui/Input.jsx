// src/ui/Input.jsx
export default function Input({
  className = "",
  label,
  hint,
  error,
  ...props
}) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs text-white/70">{label}</div> : null}
      <input
        className={[
          "w-full rounded-xl border bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition",
          error
            ? "border-red-500/60 focus:border-red-400"
            : "border-white/15 focus:border-teal-300/60",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-red-300">{error}</div> : null}
      {!error && hint ? (
        <div className="mt-1 text-xs text-white/40">{hint}</div>
      ) : null}
    </label>
  );
}
