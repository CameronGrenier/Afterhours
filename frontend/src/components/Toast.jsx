import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, CircleX } from "lucide-react";

import { ToastContext } from "@/hooks/useToast";

/**
 * Toast notification system
 * =========================================================================
 *
 * An app-wide, imperative toast system. Wrap the app in <ToastProvider> (see
 * main.jsx) and call useToast() anywhere to push notifications:
 *
 *   const { success, warning, error, info, toast, dismiss } = useToast();
 *   info("Player has joined!");
 *   error("Could not create room", { duration: 6000 });
 *
 * Visual style: a monochrome dark frosted pill (matching the site's stark
 * black/white "nightclub / Cards Against Humanity" look) distinguished only by
 * a 2px flat colored border + matching icon per variant. The variant colors are
 * defined as CSS variables in index.css (--color-success / --color-warning /
 * --color-info, with "error" reusing --color-danger) so they can be tweaked.
 *
 * Toasts stack top-center, newest on top, and each auto-dismisses on its own
 * timer.
 */

// Highest z so toasts sit above the Panel (z-[9999]).
const TOAST_Z = "z-[10000]";

// Most toasts on screen at once; older ones drop off the bottom.
const MAX_TOASTS = 4;

// Per-variant defaults. Errors/warnings linger a little longer.
const DEFAULT_DURATION = {
  success: 3500,
  info: 3500,
  warning: 5000,
  error: 5000,
};

// Variant → presentation. Colors reference the Tailwind theme variables.
const VARIANT_CONFIG = {
  success: {
    Icon: CheckCircle2,
    border: "border-success",
    iconColor: "text-success",
    ariaLive: "polite",
  },
  warning: {
    Icon: AlertTriangle,
    border: "border-warning",
    iconColor: "text-warning",
    ariaLive: "polite",
  },
  error: {
    // "error" reuses the existing --color-danger.
    Icon: XCircle,
    border: "border-danger",
    iconColor: "text-danger",
    ariaLive: "assertive",
  },
  info: {
    Icon: Info,
    border: "border-info",
    iconColor: "text-info",
    ariaLive: "polite",
  },
};

// Module-level counter for stable, unique ids without external deps.
let nextId = 0;

/**
 * ToastProvider
 *
 * Owns the toast queue and exposes the imperative API via context. Renders the
 * fixed, top-center container into a portal on document.body so toasts escape
 * any `overflow-hidden` ancestor (e.g. the <main> in App.jsx).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((variant, message, opts = {}) => {
    const safeVariant = VARIANT_CONFIG[variant] ? variant : "info";
    const id = nextId++;
    const duration =
      typeof opts.duration === "number"
        ? opts.duration
        : DEFAULT_DURATION[safeVariant];

    setToasts((prev) => {
      // Newest on top; cap the visible count by dropping the oldest (tail).
      const next = [{ id, variant: safeVariant, message, duration }, ...prev];
      return next.slice(0, MAX_TOASTS);
    });

    return id;
  }, []);

  // Stable API object so consumers' effects don't re-fire on every render.
  const api = useMemo(
    () => ({
      toast: ({ variant = "info", message, duration } = {}) =>
        push(variant, message, { duration }),
      success: (message, opts) => push("success", message, opts),
      warning: (message, opts) => push("warning", message, opts),
      error: (message, opts) => push("error", message, opts),
      info: (message, opts) => push("info", message, opts),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className={`pointer-events-none fixed top-0 left-1/2 mt-6 flex -translate-x-1/2 flex-col items-center gap-2 ${TOAST_Z}`}
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/**
 * ToastItem
 *
 * A single frosted pill. Owns its enter/exit transition and auto-dismiss timer.
 *
 * Lifecycle: mounts hidden → animates in on the next frame → auto-hides after
 * `duration` → after the exit transition, asks the provider to remove it.
 *
 * @param {object} props
 * @param {{id:number,variant:string,message:string,duration:number}} props.toast
 * @param {(id:number)=>void} props.onDismiss
 */
function ToastItem({ toast, onDismiss }) {
  const { id, variant, message, duration } = toast;
  const { Icon, border, iconColor, ariaLive } = VARIANT_CONFIG[variant];

  // Drives the enter/exit transition. Start hidden so the browser paints the
  // off-screen state first; flipping to visible next frame animates the slide.
  const [visible, setVisible] = useState(false);
  const exitTimerRef = useRef(null);

  // Begin the exit animation, then remove after the transition finishes.
  const requestDismiss = useCallback(() => {
    setVisible(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    // Match the 300ms transition below before unmounting.
    exitTimerRef.current = setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const autoDismiss = setTimeout(requestDismiss, duration);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(autoDismiss);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [duration, requestDismiss]);

  return (
    <div
      role="status"
      aria-live={ariaLive}
      className={`pointer-events-auto flex w-full max-w-* items-center gap-3 rounded-lg border-2 ${border} bg-black/50 px-4 py-2.5 font-sans text-sm text-white shadow-lg backdrop-blur-sm transition-all duration-300 ease-out motion-reduce:transition-none md:text-base ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <Icon size={20} className={`shrink-0 ${iconColor}`} aria-hidden="true" />
      <span className="flex-1 min-w-0">{message}</span>
      <button
        type="button"
        onClick={requestDismiss}
        aria-label="Dismiss notification"
        className="ml-2 shrink-0 cursor-pointer text-white/70 transition-colors hover:text-white"
      >
        <CircleX size={18} />
      </button>
    </div>
  );
}
