type AppErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type AppEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: AppErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __appEvents?: AppEvents;
    __lovableEvents?: AppEvents;
  }
}

export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const capture = window.__appEvents?.captureException ?? window.__lovableEvents?.captureException;
  capture?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
