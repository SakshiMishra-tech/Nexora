import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingBag,
  User,
  Image as ImageIcon,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Tag,
  MapPin,
  AlertCircle,
  GripVertical,
  Star,
  Trash,
  Sparkles,
  Laptop,
  Bike,
  BedDouble,
  Shirt,
  Gamepad2,
  Trophy,
  Music,
  Wrench,
  GraduationCap,
  NotebookPen,
  Package,
  BookOpen,
  Heart,
  Info,
  Tv,
  HelpCircle,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  type ListingFormValues,
  emptyListingForm,
  type MarketplaceListing
} from "@/lib/marketplace";
import {
  validateListingForm,
  parseAndValidateTags,
  parseAndValidateSpecifications,
} from "@/lib/marketplace-validation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface SellItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ListingFormValues;
  onSubmit: (values: ListingFormValues, isDraft: boolean) => Promise<void> | void;
}

type WizardStep =
  | "category"
  | "details"
  | "media"
  | "success";

const MAX_IMAGES = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Category configuration
const CATEGORIES_WIZARD = [
  { id: "Books", name: "Books", emoji: "📚", icon: BookOpen, desc: "Textbooks, reference guides, exam preparation bundles" },
  { id: "Electronics", name: "Electronics", emoji: "💻", icon: Laptop, desc: "Laptops, phones, smartwatches, calculators, adapters" },
  { id: "Cycles", name: "Cycles", emoji: "🚲", icon: Bike, desc: "Campus commutes, bicycles, helmets, lock stacks" },
  { id: "Hostel Essentials", name: "Hostel Essentials", emoji: "🛏", icon: BedDouble, desc: "Mattresses, tables, mirrors, extension cables" },
  { id: "Furniture", name: "Furniture", emoji: "🪑", icon: Package, desc: "Chairs, bookshelves, study tables" },
  { id: "Fashion", name: "Fashion", emoji: "👕", icon: Shirt, desc: "University hoodies, lab coats, sneakers, bags" },
  { id: "Gaming", name: "Gaming", emoji: "🎮", icon: Gamepad2, desc: "Gaming consoles, controller accessories, game CDs" },
  { id: "Sports", name: "Sports", emoji: "🏸", icon: Trophy, desc: "Badminton rackets, cricket kits, dumbbells" },
  { id: "Notes", name: "Notes", emoji: "📖", icon: NotebookPen, desc: "Handwritten semester notes, summaries, worksheets" },
  { id: "Others", name: "Others", emoji: "📦", icon: Package, desc: "Miscellaneous campus items & services" }
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Books": ["Textbooks", "Reference Books", "Exam Prep", "Novels", "Magazines"],
  "Electronics": ["Laptops", "Smartphones", "Tablets", "Headphones", "Smart Watches", "Calculators", "Chargers & Cables"],
  "Cycles": ["Cycles", "Helmets", "Locks & Chains", "Spare Parts"],
  "Hostel Essentials": ["Mattresses", "Study Lamps", "Buckets & Mugs", "Hangers & Hooks", "Mirrors", "Extension Boards"],
  "Furniture": ["Chairs", "Tables", "Wardrobes", "Book Shelves"],
  "Fashion": ["Clothes", "Shoes", "Backpacks", "Watches"],
  "Gaming": ["Consoles", "Controllers", "Video Games", "Gaming Accessories"],
  "Sports": ["Badminton Rackets", "Cricket Bats", "Footballs", "Gym & Dumbbells"],
  "Notes": ["Class Notes", "Exam Summaries", "Handwritten Stack"],
  "Others": ["Lab Coats", "Drafters & T-Squares", "Decorations", "Miscellaneous"]
};

export function SellItemForm({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: SellItemFormProps) {
  const [step, setStep] = useState<WizardStep>("category");
  const [values, setValues] = useState<ListingFormValues>(initialValues ?? emptyListingForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Dynamic Specifications fields State
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Books");

  const { profile, user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initialValues);
  const isInitialized = useRef(false);

  // Autosave Draft every 5 seconds
  useEffect(() => {
    if (!open || step === "success") return;
    const interval = setInterval(() => {
      localStorage.setItem("nx-listing-draft", JSON.stringify({ values, selectedCategory, selectedSubcategory, specs }));
    }, 5000);
    return () => clearInterval(interval);
  }, [values, selectedCategory, selectedSubcategory, specs, open, step]);

  // Restore Draft on mount / modal open - Run ONLY ONCE when open goes false -> true
  useEffect(() => {
    if (!open) {
      isInitialized.current = false;
      return;
    }

    if (isInitialized.current) return;
    isInitialized.current = true;

    if (initialValues) {
      setValues({
        ...initialValues,
        images: initialValues.images || [],
      });
      setSelectedCategory(initialValues.category || "Books");
      // Deserialize specs
      const specMap: Record<string, string> = {};
      if (initialValues.specifications) {
        initialValues.specifications.split(",").forEach(pair => {
          const [k, v] = pair.split(":").map(s => s.trim());
          if (k && v) specMap[k] = v;
        });
      }
      setSpecs(specMap);
      setStep("category");
    } else {
      const saved = localStorage.getItem("nx-listing-draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (window.confirm("You have an unsaved draft. Would you like to restore it?")) {
            setValues({
              ...parsed.values,
              images: parsed.values.images || [],
            });
            setSelectedCategory(parsed.selectedCategory || "Books");
            setSelectedSubcategory(parsed.selectedSubcategory || "");
            setSpecs(parsed.specs || {});
            setStep("details");
            return;
          } else {
            localStorage.removeItem("nx-listing-draft");
          }
        } catch(e) {
          console.error(e);
        }
      }
      setValues(emptyListingForm);
      setStep("category");
    }
  }, [open, initialValues]);

  const setVal = <K extends keyof ListingFormValues>(k: K, v: ListingFormValues[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
  };

  // Convert files or strings into previewable URLs
  const displayImageUrls = useMemo(() => {
    const imgs = values.images || [];
    return imgs.map((img) => {
      if (typeof img === "string") return img;
      if (img instanceof File) {
        try {
          return URL.createObjectURL(img);
        } catch {
          return "";
        }
      }
      return "";
    });
  }, [values.images]);

  // Drag and drop handlers
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).filter((f) => ACCEPTED_TYPES.includes(f.type));
    const imgs = values.images || [];
    if (imgs.length + newFiles.length > MAX_IMAGES) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }
    setVal("images", [...imgs, ...newFiles]);
  };

  const removeImage = (idx: number) => {
    const imgs = values.images || [];
    setVal("images", imgs.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    if (step === "category") {
      if (!selectedSubcategory) {
        toast.error("Please select a subcategory first.");
        return;
      }
      setStep("details");
    } else if (step === "details") {
      // Validate details, pricing and location inputs before moving forward
      if (values.title.length < 5) {
        setErrors({ title: "Title is too short. Minimum 5 characters." });
        toast.error("Title must be at least 5 characters.");
        return;
      }
      if (values.description.length < 25) {
        setErrors({ description: "Description is too short. Minimum 25 characters." });
        toast.error("Description must be at least 25 characters explaining the item.");
        return;
      }
      if (!values.price || Number(values.price) <= 0) {
        setErrors({ price: "Enter a valid expected price." });
        toast.error("Please specify a valid expected selling price.");
        return;
      }
      if (!values.pickupArea) {
        setErrors({ pickupArea: "Pickup spot landmark is required." });
        toast.error("Please supply a pickup area landmark.");
        return;
      }

      setErrors({});
      // Serialize specs to specifications
      const serialized = Object.entries(specs)
        .filter(([_, v]) => v.trim() !== "")
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      setVal("specifications", serialized);
      setStep("media");
    }
  };

  const handleBack = () => {
    if (step === "details") setStep("category");
    else if (step === "media") setStep("details");
  };

  const handlePublish = async (isDraftMode: boolean) => {
    const finalValues = { ...values };

    if (isDraftMode) {
      // Auto-fill minimum draft requirements if they are empty
      if (!finalValues.title.trim() || finalValues.title.length < 5) {
        finalValues.title = "Draft - " + (selectedCategory || "Item");
      }
      if (!finalValues.description.trim() || finalValues.description.length < 25) {
        finalValues.description = "Draft listing description. Please update this content with item details.";
      }
      if (!finalValues.price || Number(finalValues.price) <= 0) {
        finalValues.price = "1";
      }
      if (!finalValues.pickupArea.trim()) {
        finalValues.pickupArea = "Campus Handoff";
      }
    }

    // Run core validation on finalValues
    const validation = validateListingForm(finalValues, isDraftMode);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors).filter(Boolean)[0];
      toast.error(firstError || "Please check all required fields.");
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(finalValues, isDraftMode);
      localStorage.removeItem("nx-listing-draft");
      if (!isDraftMode) {
        toast.success("Listing posted successfully!");
        setStep("success");
      } else {
        toast.success("Draft saved successfully!");
        onOpenChange(false);
      }
    } catch(err: any) {
      const msg = err?.message || "An unexpected error occurred.";
      toast.error(msg);
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] rounded-[2rem] overflow-hidden p-0 bg-background border-border flex flex-col">
        <DialogTitle className="sr-only font-black">Post Listing Wizard</DialogTitle>

        {/* ── Progress indicator ── */}
        <div className="p-5 border-b border-border shrink-0">
          <div className="flex items-center justify-between text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
            <span>Post New Campus Listing</span>
            <span>Step {["category", "details", "media", "success"].indexOf(step) + 1} of 4</span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((["category", "details", "media", "success"].indexOf(step) + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Form Step Body ── */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* STEP 1: CATEGORY & SUBCATEGORY */}
          {step === "category" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-foreground">Choose Category</h3>
                <p className="text-xs text-muted-foreground">Select a category and subcategory that best describes your listing.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES_WIZARD.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setVal("category", cat.id as any);
                        setSelectedSubcategory(""); // Reset subcategory when category changes
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 group ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary shadow-glow"
                          : "border-border bg-card text-foreground hover:border-primary/40 hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="p-3 rounded-xl bg-secondary text-primary transition-transform group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-black">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedCategory && (
                <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-border/40 pt-4">
                  <label className="text-xs font-black uppercase text-muted-foreground">Select Subcategory</label>
                  <div className="flex flex-wrap gap-2">
                    {(SUBCATEGORIES[selectedCategory] || []).map((sub) => {
                      const isSubSelected = selectedSubcategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSelectedSubcategory(sub)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            isSubSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-soft"
                              : "bg-card text-foreground border-border hover:bg-secondary/40"
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DETAILS & PRICING & LOCATION */}
          {step === "details" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-foreground">Listing Details & Pricing</h3>
                <p className="text-xs text-muted-foreground">Provide core specifications, price parameters, and pickup point details.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">Listing Title</label>
                  <input
                    type="text"
                    placeholder="e.g. HC Verma Physics Vol 1 & 2"
                    value={values.title}
                    onChange={(e) => setVal("title", e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none ${errors.title ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}
                  />
                  {errors.title && <p className="text-[10px] font-bold text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe usage period, scratches, highlights, pages missing, or features..."
                    value={values.description}
                    onChange={(e) => setVal("description", e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none resize-none ${errors.description ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}
                  />
                  {errors.description && <p className="text-[10px] font-bold text-destructive">{errors.description}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Condition</label>
                  <select
                    value={values.condition}
                    onChange={(e) => setVal("condition", e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold outline-none"
                  >
                    {MARKETPLACE_CONDITIONS.map(cond => <option key={cond}>{cond}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground font-black">Selling Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={values.price}
                    onChange={(e) => setVal("price", e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none ${errors.price ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Original Purchase Price (₹) - Optional</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={values.originalPrice}
                    onChange={(e) => setVal("originalPrice", e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card/45 sm:col-span-1">
                  <div>
                    <p className="text-xs font-black">Price is Negotiable</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">Accept offers below expected price.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={values.isNegotiable}
                    onChange={(e) => setVal("isNegotiable", e.target.checked)}
                    className="rounded border-border text-primary h-4 w-4"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 border-t border-border/40 pt-4">
                  <label className="text-xs font-bold text-muted-foreground">Pickup Landmark / Spot</label>
                  <input
                    type="text"
                    placeholder="e.g. Library front gate, Hostel 5 Block A lobby"
                    value={values.pickupArea}
                    onChange={(e) => setVal("pickupArea", e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none ${errors.pickupArea ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}
                  />
                  {errors.pickupArea && <p className="text-[10px] font-bold text-destructive">{errors.pickupArea}</p>}
                </div>

                {/* Category-Specific fields */}
                {selectedCategory === "Electronics" && (
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2 border-t border-border/40 pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Brand</label>
                      <input type="text" placeholder="Apple, Lenovo, Sony" value={specs.Brand || ""} onChange={(e) => setSpecs({ ...specs, Brand: e.target.value })} className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Model</label>
                      <input type="text" placeholder="e.g. WH-1000XM4" value={specs.Model || ""} onChange={(e) => setSpecs({ ...specs, Model: e.target.value })} className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold outline-none" />
                    </div>
                  </div>
                )}

                {selectedCategory === "Books" && (
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2 border-t border-border/40 pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Author</label>
                      <input type="text" placeholder="e.g. HC Verma" value={specs.Author || ""} onChange={(e) => setSpecs({ ...specs, Author: e.target.value })} className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground">Semester / Year</label>
                      <input type="text" placeholder="e.g. 3rd Semester" value={specs.Semester || ""} onChange={(e) => setSpecs({ ...specs, Semester: e.target.value })} className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold outline-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PHOTOS UPLOAD */}
          {step === "media" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-foreground">Photos</h3>
                <p className="text-xs text-muted-foreground">Add up to 10 photos of your product from multiple angles.</p>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-card/40 hover:bg-secondary/40 cursor-pointer transition-colors"
              >
                <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-xs font-black">Click or drag photos here to upload</p>
                <p className="text-[10px] text-muted-foreground mt-1">JPEG, PNG, WEBP files up to 5MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {(values.images || []).length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {(values.images || []).map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-secondary">
                      <img
                        src={displayImageUrls[i] || "/placeholder.jpg"}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center text-success animate-bounce">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">Listing Posted Successfully!</h3>
                <p className="text-xs text-muted-foreground mt-1 font-bold">Your item is now live and discoverable across your campus.</p>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-4 justify-center">
                <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-black">
                  Close Panel
                </button>
                <button type="button" onClick={() => setStep("category")} className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-black shadow-soft">
                  Post Another Item
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── Wizard Navigation Footer ── */}
        {step !== "success" && (
          <div className="shrink-0 border-t border-border p-4 bg-card/30 flex justify-between items-center">
            <div>
              {step !== "category" && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-xs font-black text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePublish(true)}
                className="rounded-xl border border-border bg-card/60 px-4 py-2 text-xs font-black text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              >
                Save Draft
              </button>

              {step === "media" ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePublish(false)}
                  className="rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-xs font-black shadow-soft hover:shadow-glow flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Post</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-foreground text-background px-6 py-2.5 text-xs font-black shadow-soft hover:bg-foreground/95 flex items-center gap-1"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
