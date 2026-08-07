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
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);

  const requestModuleAccess = async (path: string, e?: React.MouseEvent) => {
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
      if (e) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        // Position below the clicked element, horizontally centered to the element
        setClickPos({ x: rect.left + rect.width / 2, y: rect.bottom + 12 });
      } else {
        setClickPos(null);
      }
      setBlockedModule(module);
      return;
    }

    void navigate({ to: path });
  };

  const accessModal = blockedModule ? (
    <ModuleAccessModal 
      moduleName={blockedModule.label} 
      onClose={() => setBlockedModule(null)} 
      position={clickPos}
    />
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
    if (loading) return;

    if (!user) {
      void navigate({ to: AUTH_ROUTES.login, replace: true });
      return;
    }

    getUserSettings(user.id).then((settings) => {
      if (settings && isModuleEnabled(settings, moduleId) === false) {
        setIsExplicitlyDisabled(true);
      } else {
        setIsExplicitlyDisabled(false);
      }
      setChecked(true);
    });
  }, [moduleId, user, loading, navigate]);

  // Still loading — render nothing so no flash
  if (loading || (!user && !loading) || !checked) return null;

  // Module is disabled: render children + overlay popup on top.
  // We do NOT navigate away. The popup sits on top of whatever page is shown.
  if (isExplicitlyDisabled && module) {
    return (
      <>
        {/* Keep background content visible but dimmed — do not navigate */}
        <div className="pointer-events-none select-none opacity-30 blur-[2px]">
          {children}
        </div>

        {/* Overlay popup — fixed on top, centred. We pass no position so it falls back to a default centered or bottom position */}
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
  position,
}: {
  moduleName: string;
  onClose: () => void;
  position?: { x: number; y: number } | null;
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

  // Click outside listener
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // If they click outside this modal, we close it.
      // We check if the click target is outside of our dialog container.
      const el = document.getElementById("module-access-modal-card");
      if (el && !el.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use capture phase so it triggers even if the inner element stops propagation, 
    // but give a tiny delay to avoid closing immediately from the click that opened it.
    const timer = setTimeout(() => {
      window.addEventListener("click", onClick, true);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", onClick, true);
    };
  }, [onClose]);

  const style: React.CSSProperties = position
    ? {
        position: "fixed",
        top: position.y,
        left: position.x,
        transform: "translateX(-50%)",
        zIndex: 100,
      }
    : {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 100,
      };

  return (
    <div
      id="module-access-modal-card"
      style={style}
      className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-mega text-card-foreground animate-in fade-in slide-in-from-bottom-2 duration-200"
      role="dialog"
      aria-modal="false"
      aria-label="Campus space is not active"
    >
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
  );
}
