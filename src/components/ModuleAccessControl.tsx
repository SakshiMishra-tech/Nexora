import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Settings, X, Layers, Lock } from "lucide-react";
import { AUTH_ROUTES } from "@/lib/auth";
import { getModuleByPath, type CampusModuleId } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";
import { getUserSettings, isModuleEnabled } from "@/services/user-settings.service";

/** Hook used in nav buttons to intercept disabled module clicks */
export function useModuleAccessNavigation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blockedModule, setBlockedModule] = useState<ReturnType<typeof getModuleByPath> | null>(null);

  const requestModuleAccess = async (path: string) => {
    const module = getModuleByPath(path);

    if (!module) {
      void navigate({ to: path });
      return;
    }

    if (!user) {
      void navigate({ to: AUTH_ROUTES.login });
      return;
    }

    const settings = await getUserSettings(user.id);
    if (settings && !isModuleEnabled(settings, module.id as CampusModuleId)) {
      // Show popup — do NOT navigate
      setBlockedModule(module);
      return;
    }

    void navigate({ to: path });
  };

  const accessModal = blockedModule ? (
    <ModuleAccessModal moduleName={blockedModule.label} onClose={() => setBlockedModule(null)} />
  ) : null;

  return { requestModuleAccess, accessModal };
}

/**
 * Wraps a route's page component.
 * If the module is disabled → renders the page's children PLUS an overlay popup
 * (does NOT replace the page or navigate anywhere).
 */
export function ModuleAccessBoundary({
  moduleId,
  children,
}: {
  moduleId: CampusModuleId;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isExplicitlyDisabled, setIsExplicitlyDisabled] = useState(false);
  const [checked, setChecked] = useState(false);

  const module = getModuleByPath(
    moduleId === "campus-connect" ? "/dating" : `/${moduleId}`,
  );

  useEffect(() => {
    if (!user || loading) return;

    getUserSettings(user.id).then((settings) => {
      if (settings && isModuleEnabled(settings, moduleId) === false) {
        setIsExplicitlyDisabled(true);
      } else {
        setIsExplicitlyDisabled(false);
      }
      setChecked(true);
    });
  }, [moduleId, user, loading]);

  // Still loading — render nothing so no flash
  if (!checked) return null;

  // Module is disabled: render children + overlay popup on top.
  // We do NOT navigate away. The popup sits on top of whatever page is shown.
  if (isExplicitlyDisabled && module) {
    return (
      <>
        {/* Keep background content visible but dimmed — do not navigate */}
        <div className="pointer-events-none select-none opacity-30 blur-[2px]">
          {children}
        </div>

        {/* Overlay popup — fixed on top, centred */}
        <ModuleAccessModal
          moduleName={module.label}
          onClose={() => {
            setIsExplicitlyDisabled(false);
            // Go back to home instead of the locked route
            void navigate({ to: "/", replace: true });
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}

/** The actual popup card — renders as a fixed overlay, no page navigation */
export function ModuleAccessModal({
  moduleName,
  onClose,
}: {
  moduleName: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    window.sessionStorage.setItem("nexora-settings-section", "spaces");
    onClose();
    void navigate({ to: AUTH_ROUTES.settings });
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Campus space is not active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Compact card — smaller than a full modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-mega text-card-foreground animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 pr-6">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Lock className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              {moduleName}
            </span>
            <h3 className="mt-0.5 text-sm font-bold text-foreground">
              This space is currently paused
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Go to <strong>Settings → Campus Spaces</strong> and turn on{" "}
              <span className="font-semibold text-foreground">{moduleName}</span> to access it.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleGoToSettings}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Open Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
