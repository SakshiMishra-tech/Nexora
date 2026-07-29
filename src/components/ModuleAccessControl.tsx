import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Settings, X } from "lucide-react";
import { AUTH_ROUTES } from "@/lib/auth";
import { getModuleByPath, type CampusModuleId } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";

import { getUserSettings, isModuleEnabled } from "@/services/user-settings.service";

export function useModuleAccessNavigation() {
  const navigate = useNavigate();
  const { profileChecked, user } = useAuth();
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

    if (!profileChecked) {
      return;
    }

    const settings = await getUserSettings(user.id);
    if (!isModuleEnabled(settings, module.id as CampusModuleId)) {
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
  const { profileChecked, user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const module = getModuleByPath(
    moduleId === "campus-connect" ? "/dating" : `/${moduleId}`,
  );

  useEffect(() => {
    if (!user) {
      void navigate({ to: AUTH_ROUTES.login, replace: true });
      return;
    }

    if (!profileChecked) return;

    getUserSettings(user.id).then((settings) => {
      if (!isModuleEnabled(settings, moduleId)) {
        setModalOpen(true);
      }
    });
  }, [moduleId, navigate, profileChecked, user]);

  if (modalOpen && module) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <ModuleAccessModal
          moduleName={module.label}
          onClose={() => {
            setModalOpen(false);
            void navigate({ to: AUTH_ROUTES.dashboard, replace: true });
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

  return (
    <div className="module-access-overlay" role="dialog" aria-modal="true" aria-label="Campus space is not active">
      <section className="module-access-toast">
        <button type="button" onClick={onClose} className="module-access-close" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="module-access-copy">
          <span>{moduleName}</span>
          <p>This space is not active. Enable it from Profile Settings.</p>
        </div>
        <div className="module-access-actions">
          <button
            type="button"
            onClick={() => {
              onClose();
              void navigate({ to: AUTH_ROUTES.settings });
            }}
            className="module-onboarding-save"
          >
            <Settings className="h-4 w-4" />
            Open Settings
          </button>
        </div>
      </section>
    </div>
  );
}
