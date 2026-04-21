import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidEmail(email: string): boolean {
  const v = email.trim();
  if (!v) return false;
  // pragmatic validation (backend still validates strictly)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
