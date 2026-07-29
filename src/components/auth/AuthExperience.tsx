import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Chrome,
  Eye,
  EyeOff,
  Github,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  X,
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
import campusScene from "@/assets/campus-scene.png";

type AuthMode = "sign-in" | "sign-up";
type PendingAction = "email" | "google" | "github" | "reset" | "verify" | "resend" | null;
type PolicyModalType = "terms" | "privacy" | null;

function isHumanReadable(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) return false;
  // Reject JSON-like strings: "{}", "[]", '{"key":"value"}', etc.
  if (/^\s*[{["]/.test(trimmed) && /[}\]"]\s*$/.test(trimmed)) return false;
  // Reject strings that are purely non-alphabetic (error codes, numbers, etc.)
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

  // Special handle for AuthRetryableFetchError or 500 status
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

  // Handle invalid API key errors
  if (normalized.includes("invalid") && (normalized.includes("key") || normalized.includes("api") || normalized.includes("token"))) {
    return "Service configuration error. Please contact support.";
  }

  // Handle network/fetch errors
  if (normalized.includes("fetch") || normalized.includes("network") || normalized.includes("failed to fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return candidate;
}

export function AuthExperience({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const {
    user,
    loading,
    profileLoading,
    profileChecked,
    signInWithPassword,
    resetPassword,
    refreshProfile,
  } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
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
  const showingOtp = isSignup && Boolean(otpEmail);
  const trimmedEmail = email.trim();
  const trimmedFirstName = firstName.trim();
  const trimmedSurname = surname.trim();
  const trimmedCollegeName = collegeName.trim();
  const fullName = [trimmedFirstName, trimmedSurname].filter(Boolean).join(" ");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const confirmPasswordValid = Boolean(confirmPassword) && password === confirmPassword;
  const confirmPasswordHint = confirmPassword && !confirmPasswordValid ? "Passwords do not match." : "";
  const passwordValidationItems = useMemo(
    () => [
      { label: "At least 8 characters", valid: passwordChecks.minLength },
      { label: "At least 1 uppercase letter", valid: passwordChecks.uppercase },
      { label: "At least 1 lowercase letter", valid: passwordChecks.lowercase },
      { label: "At least 1 number", valid: passwordChecks.number },
      { label: "At least 1 special character", valid: passwordChecks.special },
    ],
    [passwordChecks],
  );
  const signupFormValid =
    !isSignup ||
    (Boolean(trimmedFirstName) &&
      Boolean(trimmedEmail) &&
      emailValid &&
      Boolean(trimmedCollegeName) &&
      passwordValid &&
      confirmPasswordValid &&
      agreedToTerms);

  useEffect(() => {
    if (loading || profileLoading || !profileChecked || !user || showingOtp) return;

    void navigate({ to: AUTH_ROUTES.dashboard, replace: true });
  }, [loading, navigate, profileChecked, profileLoading, showingOtp, user]);

  // OTP functionality removed - direct signup instead
  // const sendOtpEmail = async (emailToSend: string) => {
  //   const { error: signUpError } = await supabase.auth.signUp({
  //     email: emailToSend,
  //     password: password,
  //   });
  //
  //   if (signUpError) {
  //     throw signUpError;
  //   }
  // };

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

  const handlePasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice("");

    if (!isSignup) {
      if (!trimmedEmail || !password) {
        setError("Email and password are required.");
        return;
      }

      setPending("email");
      const result = await signInWithPassword(trimmedEmail, password);

      if (result.error) {
        setError(getFriendlyErrorMessage(result.error));
        setPending(null);
      }
      return;
    }

    if (isSignup) {
      if (!trimmedFirstName) {
        setError("First name is required");
        return;
      }

      if (!trimmedEmail) {
        setError("College email is required");
        return;
      }

      if (!emailValid) {
        setError("Enter a valid college email address.");
        return;
      }

      if (!trimmedCollegeName) {
        setError("College name is required");
        return;
      }

      if (!passwordValid) {
        setError("Password does not meet security requirements");
        return;
      }

      if (!confirmPasswordValid) {
        setError("Passwords do not match");
        return;
      }

      if (!agreedToTerms) {
        setError("Please accept the Terms & Conditions and Privacy Policy to continue.");
        return;
      }

      setPending("email");
      try {
        // Direct signup without OTP verification
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              first_name: trimmedFirstName,
              last_name: trimmedSurname,
              full_name: fullName || trimmedFirstName,
              college_name: trimmedCollegeName,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          // Create profile entry - matching database schema (full_name, email, college_name)
          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              id: signUpData.user.id,
              email: signUpData.user.email ?? trimmedEmail ?? null,
              full_name: fullName || trimmedFirstName,
              college_name: trimmedCollegeName,
            },
            { onConflict: "id" },
          );

          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't fail signup if profile creation fails, continue to success
          }

          window.sessionStorage.setItem("nexora-show-campus-onboarding", "1");
          setPending(null);
          setSignupSuccess(true);
          setNotice("Account created successfully! Redirecting to login...");
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            void navigate({ to: AUTH_ROUTES.login, replace: true });
          }, 2000);
        }
      } catch (signupError) {
        setError(getFriendlyErrorMessage(signupError));
        console.error("Signup failed:", signupError);
        setPending(null);
      }
      return;
    }

    setPending("email");
    const result = await signInWithPassword(trimmedEmail, password);

    if (result.error) {
      setError(getFriendlyErrorMessage(result.error));
      setPending(null);
    }
  };

  // Direct signup - no OTP verification needed
  // const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
  //   ... OTP verification code removed ...
  // };

  // Resend OTP removed - not needed for direct signup
  // const handleResendOtp = async () => {
  //   ... Resend code removed ...
  // };

  const handleResetPassword = async () => {
    setError(null);
    setNotice("");

    if (!email.trim()) {
      setError("Enter your email first, then use Forgot Password.");
      return;
    }

    setPending("reset");
    const { error: resetError } = await resetPassword(email.trim());
    setPending(null);

    if (resetError) {
      setError(getFriendlyErrorMessage(resetError));
      return;
    }

    setNotice("Password reset instructions are on their way to your inbox.");
  };

  return (
    <main className="auth-student-page text-foreground">
      <img src={campusScene} alt="" className="auth-page-illustration" />
      <div className="auth-page-wash" />

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

      <section className="auth-student-layout">
        <AuthCard
          title={showingOtp ? "Verify your email" : isSignup ? "Create your account" : "Welcome Back"}
          tagline="Your campus. One connected space."
        >
          {errorMessage ? <StatusMessage tone="error">{errorMessage}</StatusMessage> : null}
          {noticeMessage ? <StatusMessage tone="info">{noticeMessage}</StatusMessage> : null}

          {signupSuccess ? (
            <div className="auth-form-stack" style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <div style={{
                  borderRadius: "9999px",
                  background: "oklch(0.7 0.16 160 / 0.14)",
                  padding: "0.75rem",
                  color: "oklch(0.35 0.12 160)",
                  display: "grid",
                  placeItems: "center"
                }}>
                  <Check className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
                </div>
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Account Created Successfully!
              </h2>
              <p className="auth-otp-copy" style={{ fontSize: "0.9rem", margin: "0 auto 1.5rem", maxWidth: "26rem" }}>
                Your Nexora account has been created. Redirecting you to login...
              </p>
              <Link
                to={AUTH_ROUTES.login}
                className="auth-submit-btn"
                style={{ width: "auto", minWidth: "160px", justifySelf: "center", textDecoration: "none" }}
              >
                Go to Sign In
              </Link>
            </div>
          ) : showingOtp ? (
            <OTPVerification
              email={otpEmail}
              otp={otp}
              pending={pending}
              onOtpChange={setOtp}
              onSubmit={() => {}}
              onResend={() => {}}
            />
          ) : (
            <>
              <form className="auth-form-stack" onSubmit={(event) => void handlePasswordAuth(event)}>
                {isSignup ? (
                  <div className="auth-signup-grid">
                    <div className="auth-signup-row">
                      <InputField
                        label="First Name *"
                        icon={<UserRound className="h-4 w-4" />}
                        value={firstName}
                        autoComplete="given-name"
                        placeholder="Aisha"
                        onChange={(event) => setFirstName(event.target.value)}
                        className="auth-signup-grid-item"
                      />
                      <InputField
                        label="Last Name / Surname"
                        icon={<UserRound className="h-4 w-4" />}
                        value={surname}
                        autoComplete="family-name"
                        placeholder="Rao"
                        onChange={(event) => setSurname(event.target.value)}
                        className="auth-signup-grid-item"
                      />
                    </div>
                    <div className="auth-signup-row">
                      <InputField
                        label="College Email *"
                        icon={<Mail className="h-4 w-4" />}
                        type="email"
                        value={email}
                        autoComplete="email"
                        placeholder="name@university.edu"
                        onChange={(event) => setEmail(event.target.value)}
                        className="auth-signup-grid-item"
                      />
                      <InputField
                        label="College Name *"
                        icon={<GraduationCap className="h-4 w-4" />}
                        value={collegeName}
                        autoComplete="organization"
                        placeholder="Nexora Institute of Technology"
                        onChange={(event) => setCollegeName(event.target.value)}
                        className="auth-signup-grid-item"
                      />
                    </div>
                    <div className="auth-signup-row">
                      <div className="auth-signup-grid-item">
                        <InputField
                          label="Password *"
                          icon={<Lock className="h-4 w-4" />}
                          type={showPassword ? "text" : "password"}
                          value={password}
                          autoComplete="new-password"
                          placeholder="Enter your password"
                          onChange={(event) => setPassword(event.target.value)}
                          action={<PasswordToggle active={showPassword} onClick={() => setShowPassword((value) => !value)} />}
                        />
                        <PasswordValidationHints checks={passwordValidationItems} visible={Boolean(password) && !passwordValid} />
                      </div>
                      <InputField
                        label="Confirm Password *"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        helperText={confirmPasswordHint}
                        className="auth-signup-grid-item"
                      />
                    </div>
                  </div>
                ) : (
                  <InputField
                    label="Email"
                    icon={<Mail className="h-4 w-4" />}
                    type="email"
                    value={email}
                    autoComplete="email"
                    placeholder="name@university.edu"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                )}

                {!isSignup && (
                  <InputField
                    label="Password"
                    icon={<Lock className="h-4 w-4" />}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    onChange={(event) => setPassword(event.target.value)}
                    action={<PasswordToggle active={showPassword} onClick={() => setShowPassword((value) => !value)} />}
                  />
                )}

                {!isSignup && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleResetPassword()}
                      disabled={pending !== null}
                      className="auth-text-link"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {isSignup && (
                  <TermsCopy
                    checked={agreedToTerms}
                    onChange={setAgreedToTerms}
                    onOpenPolicy={(type) => setPolicyModal(type)}
                  />
                )}

                <button type="submit" disabled={pending !== null || !signupFormValid} className="auth-submit-btn">
                  {pending === "email" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isSignup ? "Creating Account..." : "Signing in..."}
                    </>
                  ) : (
                    isSignup ? "Create Account" : "Login"
                  )}
                </button>
              </form>

              <AuthDivider />

              <div className="auth-oauth-grid">
                <SocialLoginButton
                  icon={<Chrome className="h-5 w-5" />}
                  label={pending === "google" ? "Opening Google..." : "Continue with Google"}
                  disabled={pending !== null}
                  onClick={() => void handleGoogleAuth()}
                />
                <SocialLoginButton
                  icon={<Github className="h-5 w-5" />}
                  label={pending === "github" ? "Opening GitHub..." : "Continue with GitHub"}
                  disabled={pending !== null}
                  onClick={() => void handleGitHubAuth()}
                />
              </div>

              <p className="auth-bottom-copy">
                {isSignup ? "Already have an account?" : "New to Nexora?"}{" "}
                <Link to={isSignup ? AUTH_ROUTES.login : AUTH_ROUTES.signup} className="auth-switch-link">
                  {isSignup ? "Sign In" : "Create Account"}
                </Link>
              </p>
            </>
          )}
        </AuthCard>
      </section>
    </main>
  );
}

function AuthCard({
  title,
  tagline,
  children,
}: {
  title: string;
  tagline: string;
  children: ReactNode;
}) {
  return (
    <section className="auth-glass-card" aria-label={title}>
      <div className="auth-brand-header">
        <Link to="/" className="auth-brand-mark">
          <span>
            <GraduationCap className="h-5 w-5" />
          </span>
          <strong>Nexora</strong>
        </Link>
        <p>{tagline}</p>
      </div>
      <div className="auth-copy-block">
        <h1>{title}</h1>
      </div>
      {children}
    </section>
  );
}

function InputField({
  label,
  icon,
  action,
  className = "",
  helperText,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  action?: ReactNode;
  helperText?: string;
}) {
  const id = useId();

  return (
    <label htmlFor={id} className={`auth-field ${className}`}>
      <span>{label}</span>
      <div className="auth-input-shell">
        <i aria-hidden="true">{icon}</i>
        <input id={id} {...props} />
        {action}
      </div>
      {helperText ? <p className="auth-field-help">{helperText}</p> : null}
    </label>
  );
}

function PasswordToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="auth-password-toggle"
      aria-label={active ? "Hide password" : "Show password"}
    >
      {active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function PasswordValidationHints({ checks, visible }: { checks: Array<{ label: string; valid: boolean }>; visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="auth-password-hints" aria-live="polite">
      {checks.map((item) => (
        <span key={item.label} className={item.valid ? "is-valid" : ""}>
          <Check className="h-3.5 w-3.5" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function SocialLoginButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="auth-oauth-btn">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function OTPVerification({
  email,
  otp,
  pending,
  onOtpChange,
  onSubmit,
  onResend,
}: {
  email: string;
  otp: string;
  pending: PendingAction;
  onOtpChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
}) {
  const id = useId();

  return (
    <form className="auth-form-stack" onSubmit={onSubmit}>
      <p className="auth-otp-copy">
        We sent a verification code to <strong>{email}</strong>.
      </p>
      <label htmlFor={id} className="auth-field">
        <span>6 digit OTP</span>
        <div className="auth-input-shell auth-otp-shell">
          <ShieldCheck className="h-4 w-4" />
          <input
            id={id}
            value={otp}
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="000000"
            onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
      </label>
      <button type="submit" disabled={pending !== null} className="auth-submit-btn">
        {pending === "verify" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Account"
        )}
      </button>
      <button type="button" onClick={onResend} disabled={pending !== null} className="auth-resend-btn">
        {pending === "resend" ? "Sending..." : "Resend OTP"}
      </button>
    </form>
  );
}

function AuthDivider() {
  return (
    <div className="auth-divider">
      <span />
      OR
      <span />
    </div>
  );
}

function TermsCopy({
  checked,
  onChange,
  onOpenPolicy,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  onOpenPolicy: (type: PolicyModalType) => void;
}) {
  return (
    <label className="auth-terms-check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="auth-terms-copy">
        I agree to the{" "}
        <button type="button" className="auth-inline-link" onClick={() => onOpenPolicy("terms")}>
          Terms & Conditions
        </button>{" "}
        and{" "}
        <button type="button" className="auth-inline-link" onClick={() => onOpenPolicy("privacy")}>
          Privacy Policy
        </button>
      </span>
    </label>
  );
}

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
        "By creating an account, you agree to use Nexora responsibly and keep your information accurate.",
        "You will not share harmful, misleading, or abusive content, and you will respect other students in campus communities, projects, and networking spaces.",
        "Nexora may moderate or suspend accounts that violate community standards or misuse campus discovery features.",
      ]
      : [
        "Your information is used to personalize the Nexora experience, keep your account secure, and support campus discovery features you choose to use.",
        "We store only the data needed for authentication, onboarding, and relevant community interactions. You can update your profile and preferences at any time.",
        "We do not sell your personal data and take reasonable steps to protect your account and campus activity.",
      ];

  return (
    <div className="auth-policy-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="auth-policy-modal">
        <div className="auth-policy-header">
          <div>
            <p className="auth-policy-eyebrow">Nexora policy</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="auth-policy-close" onClick={onClose} aria-label="Close policy dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="auth-policy-content">
          {content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="auth-policy-actions">
          <button type="button" className="auth-policy-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="auth-submit-btn auth-policy-primary" onClick={onAccept}>
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <div className={`auth-status-message auth-status-${tone}`}>
      {children}
    </div>
  );
}
