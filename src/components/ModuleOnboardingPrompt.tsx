import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type ModuleField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select";
  options?: readonly string[];
};

type ModuleOnboardingPromptProps = {
  moduleId: string;
  setupKeys: string[];
  eyebrow: string;
  title: string;
  description: string;
  fields: readonly ModuleField[];
};

export function ModuleOnboardingPrompt({
  moduleId,
  setupKeys,
  eyebrow,
  title,
  description,
  fields,
}: ModuleOnboardingPromptProps) {
  const storageBase = `nexora:module-onboarding:${moduleId}`;
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const initialValues = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.name, ""])),
    [fields],
  );

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSetup = params.get("setup");
    const shouldForceOpen = requestedSetup ? setupKeys.includes(requestedSetup) : false;
    const hasSeen = window.localStorage.getItem(`${storageBase}:seen`) === "true";
    const isComplete = window.localStorage.getItem(`${storageBase}:complete`) === "true";

    setOpen(shouldForceOpen || (!hasSeen && !isComplete));
    setSaved(isComplete);
  }, [setupKeys, storageBase]);

  const closePrompt = () => {
    window.localStorage.setItem(`${storageBase}:seen`, "true");
    setOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(`${storageBase}:seen`, "true");
    window.localStorage.setItem(`${storageBase}:complete`, "true");
    window.localStorage.setItem(`${storageBase}:data`, JSON.stringify(formValues));
    setSaved(true);
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="module-onboarding-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <section className="module-onboarding-card">
        <button type="button" onClick={closePrompt} className="module-onboarding-close" aria-label="Close setup">
          <X className="h-4 w-4" />
        </button>

        <div className="module-onboarding-header">
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="module-onboarding-form">
          <div className="module-onboarding-grid">
            {fields.map((field) => (
              <label key={field.name} className={field.type === "textarea" ? "module-field module-field-wide" : "module-field"}>
                <span>{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    value={formValues[field.name] ?? ""}
                    placeholder={field.placeholder}
                    rows={3}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                  />
                ) : field.type === "select" ? (
                  <select
                    value={formValues[field.name] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={formValues[field.name] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                  />
                )}
              </label>
            ))}
          </div>

          <div className="module-onboarding-actions">
            <button type="button" onClick={closePrompt} className="module-onboarding-skip">
              Not now
            </button>
            <button type="submit" className="module-onboarding-save">
              {saved ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              Save setup
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
