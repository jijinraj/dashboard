// src/lib/validators.js
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function passwordError(pw) {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters.";
  return "";
}
