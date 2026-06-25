import { createContext, useContext } from "react";

/**
 * ToastContext
 *
 * Holds the imperative toast API supplied by <ToastProvider> (see
 * components/Toast.jsx). Kept in its own module (separate from the provider
 * component) so the component file can stay component-only and play nicely with
 * React Fast Refresh.
 */
export const ToastContext = createContext(null);

/**
 * useToast
 *
 * Returns the imperative toast API. Must be used within <ToastProvider>.
 *
 * @returns {{
 *   toast: (opts: {variant?: string, message: string, duration?: number}) => number,
 *   success: (message: string, opts?: {duration?: number}) => number,
 *   warning: (message: string, opts?: {duration?: number}) => number,
 *   error: (message: string, opts?: {duration?: number}) => number,
 *   info: (message: string, opts?: {duration?: number}) => number,
 *   dismiss: (id: number) => void,
 * }}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
