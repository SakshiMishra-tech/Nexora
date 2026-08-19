import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  School,
  Settings,
  ShieldCheck,
  User,
  X,
  ArrowRight,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AUTH_ROUTES, getAuthRedirectUrl } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { NexoraLogo } from "@/components/brand/NexoraLogo";

type AuthMode = "sign-in" | "sign-up";
type PendingAction = "email" | "google" | "github" | "reset" | null;
type PolicyModalType = "terms" | "privacy" | null;

function isHumanReadable(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) return false;
  if (/^\s*[{["]/.test(trimmed) && /[}\]"]\s*$/.test(trimmed)) return false;
  if (!/[a-zA-Z]{2,}/.test(trimmed)) return false;
  return true;
}

function getFriendlyErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (typeof error === "string") {
    const trimmed = error.trim();
    if (!trimmed) return null;
    return isHumanReadable(trimmed) ? trimmed : fallback;
  }

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const maybeError = error as {
    message?: unknown;
    error_description?: unknown;
    error?: unknown;
    status?: unknown;
    statusText?: unknown;
    name?: unknown;
  };

  if (maybeError && (maybeError.name === "AuthRetryableFetchError" || maybeError.status === 500)) {
    return "Authentication server error (500). Please try again later or verify your credentials.";
  }

  const candidate = [maybeError.message, maybeError.error_description, maybeError.error, maybeError.statusText]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((v) => v && isHumanReadable(v));

  if (!candidate) {
    return fallback;
  }

  const normalized = candidate.toLowerCase();
  if (
    (normalized.includes("already") &&
      (normalized.includes("registered") || normalized.includes("exist") || normalized.includes("user") || normalized.includes("email"))) ||
    normalized.includes("email address already")
  ) {
    return "Account already exists. Please sign in.";
  }

  if (normalized.includes("invalid") && (normalized.includes("key") || normalized.includes("api") || normalized.includes("token"))) {
    return "Service configuration error. Please contact support.";
  }

  if (normalized.includes("fetch") || normalized.includes("network") || normalized.includes("failed to fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return candidate;
}

// Authentic Google Multicolor SVG Icon
function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// Authentic GitHub Octocat SVG Icon
function GitHubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function AuthExperience({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const { user, loading, profileLoading, profileChecked } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [policyModal, setPolicyModal] = useState<PolicyModalType>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const isSignup = mode === "sign-up";
  const errorMessage = typeof error === "string" ? error.trim() : "";
  const noticeMessage = notice.trim();

  const trimmedEmail = email.trim();
  const trimmedFirstName = firstName.trim();
  const trimmedSurname = surname.trim();
  const trimmedCollegeName = collegeName.trim();
  const fullName = [trimmedFirstName, trimmedSurname].filter(Boolean).join(" ");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  const signupFormValid =
    !isSignup ||
    (Boolean(trimmedFirstName) &&
      Boolean(trimmedEmail) &&
      emailValid &&
      Boolean(trimmedCollegeName) &&
      Boolean(password) &&
      password === confirmPassword &&
      agreedToTerms);

  useEffect(() => {
    if (loading || profileLoading || !profileChecked || !user) return;
    void navigate({ to: AUTH_ROUTES.dashboard, replace: true });
  }, [loading, navigate, profileChecked, profileLoading, user]);

  const handleGoogleAuth = async () => {
    setError(null);
    setNotice("");
    setPending("google");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });

    if (oauthError) {
      setError(getFriendlyErrorMessage(oauthError));
      setPending(null);
    }
  };

  const handleGitHubAuth = async () => {
    setError(null);
    setNotice("");
    setPending("github");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });

    if (oauthError) {
      setError(getFriendlyErrorMessage(oauthError));
      setPending(null);
    }
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice("");

    if (!isSignup) {
      if (!trimmedEmail) {
        setError("Email is required.");
        return;
      }
      if (!password) {
        setError("Password is required.");
        return;
      }
    } else {
      if (!trimmedFirstName) {
        setError("First name is required.");
        return;
      }
      if (!trimmedEmail) {
        setError("College email is required.");
        return;
      }
      if (!emailValid) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!trimmedCollegeName) {
        setError("College name is required.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!agreedToTerms) {
        setError("Please accept the Terms & Conditions and Privacy Policy to continue.");
        return;
      }
    }

    setPending("email");
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              full_name: fullName || trimmedFirstName,
              college_name: trimmedCollegeName,
            }
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Upsert profile for new user
          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              email: data.user.email ?? trimmedEmail ?? null,
              full_name: fullName || trimmedFirstName,
              college_name: trimmedCollegeName,
            },
            { onConflict: "id" },
          );
          if (profileError) console.error("Profile creation error:", profileError);
          window.sessionStorage.setItem("nexora-show-campus-onboarding", "1");
        }
        setSignupSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="auth-startup-wrap relative flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-[#070913] p-3 text-slate-100 sm:p-5">
      {/* Rich Multi-Layered Aurora Mesh Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Animated Aurora Blooms */}
        <div className="absolute -left-20 -top-24 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-violet-600/25 to-transparent blur-[120px] animate-aurora" />
        <div className="absolute -bottom-28 -right-20 h-[520px] w-[520px] rounded-full bg-gradient-to-bl from-cyan-500/25 via-blue-600/20 to-transparent blur-[130px] animate-pulse" />
        <div className="absolute right-1/4 top-1/6 h-[380px] w-[380px] rounded-full bg-fuchsia-600/15 blur-[120px] animate-float" />
        <div className="absolute left-1/3 bottom-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/15 blur-[100px] animate-drift" />

        {/* Futuristic Radial Perspective Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient Top Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-black/60 pointer-events-none" />
      </div>

      {policyModal && (
        <PolicyModal
          type={policyModal}
          onClose={() => setPolicyModal(null)}
          onAccept={() => {
            setAgreedToTerms(true);
            setPolicyModal(null);
          }}
        />
      )}

      {/* Main Glassmorphic Auth Card */}
      <div
        className={`relative z-10 w-full ${
          isSignup ? "max-w-[490px]" : "max-w-[430px]"
        } rounded-3xl border border-white/[0.14] bg-[#0c1020]/90 p-5 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl transition-all duration-300 sm:p-6`}
      >
        {/* Top ambient accent glow bar */}
        <div className="absolute -top-px left-1/2 h-[2px] w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

        {/* Brand & Clean Subtitle */}
        <div className="mb-5 flex flex-col items-center text-center">
          <Link to="/" className="group inline-flex items-center transition-transform hover:scale-102">
            <NexoraLogo size="lg" variant="dark" />
          </Link>
          <p className="mt-2 text-xs font-medium text-slate-400">
            {isSignup
              ? "Create your student account to get started"
              : "Sign in to your account"}
          </p>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="mb-4 grid grid-cols-2 rounded-xl border border-white/[0.08] bg-slate-900/80 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              if (isSignup) void navigate({ to: AUTH_ROUTES.login });
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all duration-200 ${
              !isSignup
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isSignup) void navigate({ to: AUTH_ROUTES.signup });
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all duration-200 ${
              isSignup
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Sign Up</span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-3.5 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-300">
            <span className="shrink-0 text-rose-400">⚠️</span>
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}
        {noticeMessage && (
          <div className="mb-3.5 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-300">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="leading-snug">{noticeMessage}</span>
          </div>
        )}

        {/* Signup Success View */}
        {signupSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/20">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Account Created!</h3>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              Your Nexora student account is ready. Redirecting to sign in...
            </p>
            <Link
              to={AUTH_ROUTES.login}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-500"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Auth Form */}
                <form onSubmit={(event) => void handleAuthSubmit(event)} className="space-y-3">
                  {isSignup ? (
                    <>
                      {/* First Name & Surname */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <ModernInput
                          label="First Name *"
                          icon={<User className="h-3.5 w-3.5" />}
                          value={firstName}
                          autoComplete="given-name"
                          placeholder="Aisha"
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                        <ModernInput
                          label="Last Name"
                          icon={<User className="h-3.5 w-3.5" />}
                          value={surname}
                          autoComplete="family-name"
                          placeholder="Rao"
                          onChange={(e) => setSurname(e.target.value)}
                        />
                      </div>

                      {/* College Email */}
                      <ModernInput
                        label="College Email *"
                        icon={<Mail className="h-3.5 w-3.5" />}
                        type="email"
                        value={email}
                        autoComplete="email"
                        placeholder="student@university.edu"
                        onChange={(e) => setEmail(e.target.value)}
                      />

                      {/* College Name */}
                      <ModernInput
                        label="College / University *"
                        icon={<School className="h-3.5 w-3.5" />}
                        value={collegeName}
                        autoComplete="organization"
                        placeholder="e.g. Stanford / IIT Delhi / NIT"
                        onChange={(e) => setCollegeName(e.target.value)}
                      />

                      {/* Password & Confirm */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <ModernInput
                          label="Password *"
                          icon={<Lock className="h-3.5 w-3.5" />}
                          type={showPassword ? "text" : "password"}
                          value={password}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          onChange={(e) => setPassword(e.target.value)}
                          action={
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          }
                        />
                        <ModernInput
                          label="Confirm *"
                          icon={<ShieldCheck className="h-3.5 w-3.5" />}
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          action={
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          }
                        />
                      </div>

                      {/* Terms & Conditions Check */}
                      <label className="flex cursor-pointer items-start gap-2 pt-1 text-[0.72rem] text-slate-400">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="leading-snug">
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setPolicyModal("terms")}
                            className="font-bold text-indigo-400 hover:underline"
                          >
                            Terms
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            onClick={() => setPolicyModal("privacy")}
                            className="font-bold text-indigo-400 hover:underline"
                          >
                            Privacy Policy
                          </button>
                        </span>
                      </label>
                    </>
                  ) : (
                    <>
                      {/* Sign In Fields */}
                      <ModernInput
                        label="College Email"
                        icon={<Mail className="h-3.5 w-3.5" />}
                        type="email"
                        value={email}
                        autoComplete="email"
                        placeholder="student@university.edu"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[0.7rem] font-semibold text-slate-300">
                            Password
                          </label>
                          <button
                            type="button"
                            className="text-[0.7rem] font-bold text-indigo-400 hover:text-indigo-300"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <ModernInput
                          icon={<Lock className="h-3.5 w-3.5" />}
                          type={showPassword ? "text" : "password"}
                          value={password}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          onChange={(e) => setPassword(e.target.value)}
                          action={
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          }
                        />
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={pending !== null || !signupFormValid}
                    className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all duration-200 hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    {pending === "email" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>{isSignup ? "Signing up..." : "Signing in..."}</span>
                      </>
                    ) : (
                      <span>{isSignup ? "Sign Up" : "Sign In"}</span>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-3.5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Or continue with</span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>

                {/* Social Logins */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleGoogleAuth()}
                    disabled={pending !== null}
                    className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-200 shadow-sm transition-all duration-200 hover:border-white/25 hover:bg-slate-800/90 hover:text-white active:scale-[0.98] disabled:opacity-50"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    <span>{pending === "google" ? "Connecting..." : "Google"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleGitHubAuth()}
                    disabled={pending !== null}
                    className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-200 shadow-sm transition-all duration-200 hover:border-white/25 hover:bg-slate-800/90 hover:text-white active:scale-[0.98] disabled:opacity-50"
                  >
                    <GitHubIcon className="h-4 w-4" />
                    <span>{pending === "github" ? "Connecting..." : "GitHub"}</span>
                  </button>
                </div>
              </>
        )}

        {/* Footer Micro-Copy */}
        <div className="mt-4 text-center text-[0.7rem] text-slate-500">
          <span>Protected with campus-grade 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}

// Compact, high-tech glassmorphic input component
function ModernInput({
  label,
  icon,
  action,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon: ReactNode;
  action?: ReactNode;
}) {
  const id = useId();

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-[0.7rem] font-semibold text-slate-300">
          {label}
        </label>
      )}
      <div className="group relative flex min-h-[38px] items-center gap-2 rounded-xl border border-white/[0.12] bg-slate-900/85 px-2.5 py-1 text-slate-100 shadow-inner transition-all duration-200 focus-within:border-cyan-400 focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-500/25 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.15)]">
        <span className="shrink-0 text-slate-400 transition-colors group-focus-within:text-cyan-400">
          {icon}
        </span>
        <input
          id={id}
          className="w-full min-w-0 bg-transparent text-xs font-medium text-slate-100 placeholder-slate-500 outline-none caret-cyan-400"
          {...props}
        />
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

// Policy Modal Component
function PolicyModal({
  type,
  onClose,
  onAccept,
}: {
  type: Exclude<PolicyModalType, null>;
  onClose: () => void;
  onAccept: () => void;
}) {
  const title = type === "terms" ? "Terms & Conditions" : "Privacy Policy";
  const content =
    type === "terms"
      ? [
          "By creating an account, you agree to use Nexora responsibly and keep your student profile accurate.",
          "You agree not to share harmful, abusive, or misleading content across campus spaces, project boards, and networking directories.",
          "Nexora reserves the right to moderate or suspend accounts violating campus safety standards.",
        ]
      : [
          "Your information is strictly used to authenticate your session and personalize campus networking features.",
          "We do not sell or lease student data to third-party ad brokers.",
          "You can update or delete your profile information anytime from Settings.",
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-5 text-slate-200 shadow-2xl">
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2.5 text-xs text-slate-300">
          {content.map((p, i) => (
            <p key={i} className="leading-relaxed">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
