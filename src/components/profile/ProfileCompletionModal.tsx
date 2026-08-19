import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, X, UserCircle, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AUTH_ROUTES } from "@/lib/auth";

interface ProfileCompletionModalProps {
  onClose: () => void;
  featureName?: string;
}

/**
 * Modal shown when a user tries to access a feature that requires a complete campus profile.
 */
export function ProfileCompletionModal({ onClose, featureName }: ProfileCompletionModalProps) {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCompleteProfile = () => {
    onClose();
    void navigate({ to: AUTH_ROUTES.settings });
  };

  const benefits = [
    { icon: ShieldCheck, text: "Verified Student Identity" },
    { icon: Sparkles, text: "Better Recommendations" },
    { icon: CheckCircle2, text: "Access To All Campus Features" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-completion-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-mega text-card-foreground animate-in zoom-in-95 duration-150">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserCircle className="h-7 w-7" />
        </div>

        {/* Title */}
        <h2 id="profile-completion-title" className="text-base font-black text-foreground">
          Complete Your Campus Profile
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {featureName
            ? `To access ${featureName}, you must complete your campus profile.`
            : "To access this feature, you must complete your campus profile."}
        </p>

        {/* Benefits */}
        <div className="mt-5 space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Benefits
          </p>
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="profile-completion-modal-cta"
            onClick={handleCompleteProfile}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity active:scale-95"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook-style helper: returns a render fn and open state.
 * Usage:
 *   const { openProfileModal, profileModalNode } = useProfileCompletionModal();
 *   // Render {profileModalNode} in JSX, call openProfileModal() when needed.
 */
export function useProfileCompletionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState<string | undefined>(undefined);

  const openProfileModal = (name?: string) => {
    setFeatureName(name);
    setIsOpen(true);
  };

  const profileModalNode = isOpen ? (
    <ProfileCompletionModal
      featureName={featureName}
      onClose={() => setIsOpen(false)}
    />
  ) : null;

  return { openProfileModal, profileModalNode, isProfileModalOpen: isOpen };
}
