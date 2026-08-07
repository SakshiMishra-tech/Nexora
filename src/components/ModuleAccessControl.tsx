import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Settings, X, Layers, AlertCircle } from "lucide-react";
import { AUTH_ROUTES } from "@/lib/auth";
import { getModuleByPath, type CampusModuleId } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";
import { getUserSettings, isModuleEnabled } from "@/services/user-settings.service";

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
    });
  }, [moduleId, user, loading]);

  if (isExplicitlyDisabled && module) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <ModuleAccessModal
          moduleName={module.label}
          onClose={() => {
            setIsExplicitlyDisabled(false);
            void navigate({ to: "/", replace: true });
          }}
        />
      </main>
    );
  }

  return <>{children}</>;
}

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Campus space is not active"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-mega text-card-foreground">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">
              {moduleName}
            </span>
            <h3 className="mt-0.5 text-base font-bold text-foreground">
              This space is currently paused
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              You can turn on and configure this campus space anytime from your account settings.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleGoToSettings}
            className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Open Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
