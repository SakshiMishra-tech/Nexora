import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  type ListingFormValues,
  emptyListingForm,
} from "@/lib/marketplace";
import {
  validateListingForm,
  parseAndValidateTags,
  parseAndValidateSpecifications,
} from "@/lib/marketplace-validation";
import {
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Loader2,
  Tag,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  GripVertical,
  Star,
} from "lucide-react";

interface SellItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ListingFormValues;
  /** May return a Promise — the form stays in loading state until it resolves. */
  onSubmit: (
    values: ListingFormValues,
    isDraft: boolean,
  ) => Promise<void> | void;
}

const MAX_IMAGES = 12;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024; // Compress if > 1.5 MB
const COMPRESS_MAX_WIDTH = 1920;
const COMPRESS_QUALITY = 0.82;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Step = "details" | "images";

/**
 * Compress an image File using canvas if it exceeds the threshold.
 * Returns the original file if it's small enough or compression fails.
 */
async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD) return file;
  if (!ACCEPTED_TYPES.includes(file.type)) return file;

  return new Promise<File>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > COMPRESS_MAX_WIDTH) {
        height = Math.round((height * COMPRESS_MAX_WIDTH) / width);
        width = COMPRESS_MAX_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file); // Compression didn't help
            return;
          }
          const compressed = new File([blob], file.name, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/webp",
        COMPRESS_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export function SellItemForm({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: SellItemFormProps) {
  const [step, setStep] = useState<Step>("details");
  const [values, setValues] = useState<ListingFormValues>(
    initialValues ?? emptyListingForm,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ListingFormValues, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(initialValues);

  const draftValidation = useMemo(() => validateListingForm(values, true), [values]);
  const publishValidation = useMemo(() => validateListingForm(values, false), [values]);

  const isDraftDisabled = !draftValidation.isValid;
  const isPublishDisabled = !publishValidation.isValid;

  /**
   * Map from File object → object URL for display.
   * Using a ref avoids re-renders on map mutations.
   */
  const previewMapRef = useRef<Map<File, string>>(new Map());

  /** Clean up object URLs when the component unmounts */
  useEffect(() => {
    return () => {
      for (const url of previewMapRef.current.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  /** Update form values when modal opens or initialValues change */
  useEffect(() => {
    if (open) {
      const initVals = initialValues ?? emptyListingForm;
      setValues(initVals);
      
      // Smart Draft Resumption
      let initialStep: Step = "details";
      if (initialValues) {
        const detailsValid = 
          initVals.title.trim().length >= 4 &&
          initVals.description.trim().length >= 18 &&
          initVals.price !== "" &&
          (initVals.category as string) !== "" &&
          initVals.pickupArea.trim().length > 0;
          
        if (detailsValid && initVals.images.length === 0) {
          initialStep = "images";
        }
      }
      
      setStep(initialStep);
      setErrors({});
      setSubmitError(null);
    }
  }, [open, initialValues]);

  /** Get the displayable URL for an image in the form */
  function getPreviewUrl(img: File | string): string {
    if (typeof img === "string") return img;
    return previewMapRef.current.get(img) ?? "";
  }

  const set = <K extends keyof ListingFormValues>(
    k: K,
    v: ListingFormValues[K],
  ) => {
    setValues((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validateDetails = () => {
    const validation = validateListingForm(values, false);
    const detailsErrors = { ...validation.errors };
    delete detailsErrors.images;
    setErrors(detailsErrors);
    return Object.keys(detailsErrors).length === 0;
  };

  const processFiles = useCallback(async (fileList: File[]) => {
    // If the total images (existing + new) would exceed the maximum limit, reject the whole action and warn the user
    if (values.images.length + fileList.length > MAX_IMAGES) {
      setErrors((p) => ({ ...p, images: `You can upload a maximum of ${MAX_IMAGES} images.` }));
      return;
    }

    const duplicates: string[] = [];
    const uniqueFilesToProcess: File[] = [];

    // Check for duplicates (same name and size)
    for (const file of fileList) {
      const isDuplicate = values.images.some((existing) => {
        if (existing instanceof File) {
          return existing.name === file.name && existing.size === file.size;
        }
        return false;
      });

      const isAlreadyInNewList = uniqueFilesToProcess.some((f) => f.name === file.name && f.size === file.size);

      if (isDuplicate || isAlreadyInNewList) {
        duplicates.push(file.name);
      } else {
        uniqueFilesToProcess.push(file);
      }
    }

    if (duplicates.length > 0) {
      setErrors((p) => ({ ...p, images: `Duplicate images are not allowed: ${duplicates.join(", ")}` }));
      return;
    }

    const validFiles: File[] = [];
    const rejected: string[] = [];

    for (const f of uniqueFilesToProcess) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        rejected.push(`${f.name}: unsupported format`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        rejected.push(`${f.name}: exceeds 5 MB limit`);
        continue;
      }
      validFiles.push(f);
    }

    if (rejected.length > 0) {
      setErrors((p) => ({
        ...p,
        images: rejected.join("; "),
      }));
      return;
    }

    if (validFiles.length === 0) return;

    // Compress images that are too large
    setCompressing(true);
    try {
      const compressed = await Promise.all(validFiles.map(compressImage));
      for (const f of compressed) {
        previewMapRef.current.set(f, URL.createObjectURL(f));
      }
      setValues((prev) => ({
        ...prev,
        images: [...prev.images, ...compressed],
      }));
      setErrors((p) => ({ ...p, images: undefined }));
    } finally {
      setCompressing(false);
    }
  }, [values.images, values.images.length]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    processFiles(Array.from(files));
  }, [processFiles]);

  const removeImage = (idx: number) => {
    const img = values.images[idx];
    if (img instanceof File) {
      const url = previewMapRef.current.get(img);
      if (url) URL.revokeObjectURL(url);
      previewMapRef.current.delete(img);
    }
    set("images", values.images.filter((_, i) => i !== idx));
  };

  const moveImage = (from: number, to: number) => {
    const arr = [...values.images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    set("images", arr);
  };

  // ── Drag & Drop on drop zone ──
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  }, [processFiles]);

  // ── Drag & Drop for reordering ──
  const handleThumbDragStart = useCallback((idx: number) => {
    setDragSourceIndex(idx);
  }, []);

  const handleThumbDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  }, []);

  const handleThumbDrop = useCallback((idx: number) => {
    if (dragSourceIndex !== null && dragSourceIndex !== idx) {
      moveImage(dragSourceIndex, idx);
    }
    setDragSourceIndex(null);
    setDragOverIndex(null);
  }, [dragSourceIndex, values.images]);

  const handleThumbDragEnd = useCallback(() => {
    setDragSourceIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleSubmit = async (isDraft: boolean) => {
    const cleanTagsResult = parseAndValidateTags(values.tags);
    const cleanSpecsResult = parseAndValidateSpecifications(values.specifications || "");
    const cleanedValues = {
      ...values,
      tags: cleanTagsResult.error ? values.tags : (cleanTagsResult.cleaned ?? ""),
      specifications: cleanSpecsResult.error ? values.specifications : (cleanSpecsResult.cleaned ?? ""),
    };

    const validation = validateListingForm(cleanedValues, isDraft);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (!isDraft) {
        const detailsErrors = { ...validation.errors };
        delete detailsErrors.images;
        if (Object.keys(detailsErrors).length > 0) {
          setStep("details");
        }
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      setValues(cleanedValues);
      await onSubmit(cleanedValues, isDraft);
      onOpenChange(false);
      setValues(emptyListingForm);
      setStep("details");
      setErrors({});
    } catch (err: any) {
      console.error("Publishing error details:", err);
      const msg = err?.message || "Failed to save the item. Please check the fields and try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
    setStep("details");
    setErrors({});
    setSubmitError(null);
    if (!isEdit) setValues(emptyListingForm);
  };

  const goNext = () => {
    if (step === "details") {
      if (validateDetails()) setStep("images");
    }
  };

  const stepLabel =
    step === "details" ? "1 of 2 — Details" : "2 of 2 — Photos";

  const imageCount = values.images.length;
  const slotsLeft = MAX_IMAGES - imageCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[88vh] w-full max-w-xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* ── HEADER ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <DialogTitle className="font-display text-lg font-black leading-none">
              {isEdit ? "Edit Listing" : "Post New Item"}
            </DialogTitle>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              {stepLabel}
            </p>
          </div>
          {/* Step pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-8 rounded-full transition-colors ${step === "details" ? "bg-foreground" : "bg-success"}`}
              />
              <span
                className={`h-2 w-8 rounded-full transition-colors ${step === "images" ? "bg-foreground" : "bg-border"}`}
              />
            </div>
          </div>
        </div>

        {/* ── BODY (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ─ Step 1: Details ─ */}
          {step === "details" && (
            <div className="space-y-4">
              <Field label="Title" required error={errors.title}>
                <input
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. MacBook Air M2, Blue Campus Bicycle"
                  className={inputClass(!!errors.title)}
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="Price (₹)"
                  required
                  error={errors.price}
                  hint="Enter 0 for free"
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={values.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="0"
                      className={`${inputClass(!!errors.price)} pl-7`}
                    />
                  </div>
                </Field>

                <Field label="Original Price (₹)" hint="Original retail price" error={errors.originalPrice}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={values.originalPrice || ""}
                      onChange={(e) => set("originalPrice", e.target.value)}
                      placeholder="0"
                      className={`${inputClass(!!errors.originalPrice)} pl-7`}
                    />
                  </div>
                </Field>

                <Field label="Condition" required error={errors.condition}>
                  <Select
                    value={values.condition}
                    onValueChange={(v) => set("condition", v as any)}
                  >
                    <SelectTrigger className={`${selectClass()} ${errors.condition ? "border-destructive bg-destructive/5" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETPLACE_CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground -mt-2 ml-1">
                <input
                  type="checkbox"
                  checked={values.isNegotiable}
                  onChange={(e) => set("isNegotiable", e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                Price is negotiable
              </label>

              <Field label="Category" required error={errors.category}>
                <Select
                  value={values.category}
                  onValueChange={(v) => set("category", v as any)}
                >
                  <SelectTrigger className={`${selectClass()} ${errors.category ? "border-destructive bg-destructive/5" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Description"
                required
                error={errors.description}
                hint="Include age, brand, specs, reason for selling"
              >
                <div className="relative">
                  <textarea
                    value={values.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe your item — condition, what's included, why selling..."
                    rows={4}
                    className={`${inputClass(!!errors.description)} resize-none`}
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-muted-foreground">
                    {values.description.length} chars
                  </span>
                </div>
              </Field>

              <Field label="Specifications / Attributes" hint="e.g. Brand: Apple, RAM: 16GB" error={errors.specifications}>
                <input
                  value={values.specifications || ""}
                  onChange={(e) => set("specifications", e.target.value)}
                  placeholder="e.g. Brand: Apple, RAM: 16GB"
                  className={inputClass(!!errors.specifications)}
                />
              </Field>

              <Field label="Pickup Location" required error={errors.pickupArea}>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={values.pickupArea}
                    onChange={(e) => set("pickupArea", e.target.value)}
                    placeholder="e.g. Hostel 5 Gate, CSE Dept Lobby..."
                    className={`${inputClass(!!errors.pickupArea)} pl-9`}
                  />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Campus / Hostel">
                  <input
                    value={values.campus || ""}
                    onChange={(e) => set("campus", e.target.value)}
                    placeholder="e.g. North Campus, Hostel 3"
                    className={inputClass(false)}
                  />
                </Field>

                <Field label="Specific Pickup Point">
                  <input
                    value={values.pickup || ""}
                    onChange={(e) => set("pickup", e.target.value)}
                    placeholder="e.g. Gate 1, Lobby desk"
                    className={inputClass(false)}
                  />
                </Field>
              </div>

              <Field label="Tags" hint="Up to 5, comma separated" error={errors.tags}>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={values.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="e.g. laptop, apple, m2"
                    className={`${inputClass(!!errors.tags)} pl-9`}
                  />
                </div>
              </Field>
            </div>
          )}

          {/* ─ Step 2: Images ─ */}
          {step === "images" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                  {imageCount === MAX_IMAGES ? "12/12 uploaded" : `${imageCount}/${MAX_IMAGES} photos`}
                  {imageCount < MAX_IMAGES && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining)
                    </span>
                  )}
                  {imageCount === 0 && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      — at least 1 required
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">First photo = cover · Drag to reorder</p>
              </div>

              {errors.images && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errors.images}</span>
                </div>
              )}

              {/* Drop zone (shown when no images OR always available at bottom) */}
              <div
                ref={dropZoneRef}
                onDragEnter={imageCount < MAX_IMAGES ? handleDragEnter : undefined}
                onDragLeave={imageCount < MAX_IMAGES ? handleDragLeave : undefined}
                onDragOver={imageCount < MAX_IMAGES ? handleDragOver : undefined}
                onDrop={imageCount < MAX_IMAGES ? handleDrop : undefined}
                onClick={() => imageCount < MAX_IMAGES && !compressing && fileRef.current?.click()}
                className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all ${
                  imageCount >= MAX_IMAGES
                    ? "border-border bg-secondary/30 cursor-not-allowed opacity-60"
                    : isDragging
                      ? "border-primary bg-primary/10 shadow-soft cursor-pointer"
                      : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                } ${imageCount === 0 ? "py-12" : "py-6"}`}
              >
                <div className={`grid place-items-center rounded-full transition-colors ${
                  isDragging ? "bg-primary/20" : "bg-primary/10"
                } ${imageCount === 0 ? "h-12 w-12" : "h-9 w-9"}`}>
                  {compressing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Upload className={`text-primary ${imageCount === 0 ? "h-6 w-6" : "h-4 w-4"}`} />
                  )}
                </div>
                <div className="text-center">
                  {compressing ? (
                    <p className="text-sm font-bold text-primary">Compressing images...</p>
                  ) : isDragging ? (
                    <p className="text-sm font-bold text-primary">Drop images here</p>
                  ) : (
                    <>
                      <p className="font-bold">
                        {imageCount === MAX_IMAGES 
                          ? "Upload limit reached" 
                          : imageCount === 0 
                            ? "Click or drag & drop to upload" 
                            : "Add more photos"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {imageCount === MAX_IMAGES
                          ? "Remove an image to add another"
                          : `${slotsLeft} slot${slotsLeft !== 1 ? "s" : ""} left · JPG, PNG, WebP · Max 5 MB each`}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* 3-column grid with drag-to-reorder */}
              {imageCount > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {values.images.map((img, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleThumbDragStart(idx)}
                      onDragOver={(e) => handleThumbDragOver(e, idx)}
                      onDrop={() => handleThumbDrop(idx)}
                      onDragEnd={handleThumbDragEnd}
                      className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-muted transition-all cursor-grab active:cursor-grabbing ${
                        dragOverIndex === idx && dragSourceIndex !== idx
                          ? "border-primary shadow-soft scale-[1.02]"
                          : dragSourceIndex === idx
                            ? "border-border opacity-50"
                            : "border-border"
                      }`}
                    >
                      <img
                        src={getPreviewUrl(img)}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />

                      {/* Cover badge */}
                      {idx === 0 && (
                        <span className="absolute left-1 top-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[9px] font-black text-background">
                          Cover
                        </span>
                      )}

                      {/* Make Cover Button (only for idx > 0) */}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveImage(idx, 0); }}
                          className="absolute right-1 top-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[9px] font-black text-background opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
                        >
                          Make Cover
                        </button>
                      )}

                      {/* Drag handle */}
                      <div className="absolute left-1 bottom-1 grid h-5 w-5 place-items-center rounded bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <GripVertical className="h-3 w-3 text-background" />
                      </div>

                      {/* Hover actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveImage(idx, idx - 1); }}
                            className="grid h-6 w-6 place-items-center rounded-full bg-paper/90 transition hover:bg-paper"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                          className="grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground transition hover:bg-destructive/80"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {idx < values.images.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveImage(idx, idx + 1); }}
                            className="grid h-6 w-6 place-items-center rounded-full bg-paper/90 transition hover:bg-paper"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* File size badge */}
                      {img instanceof File && (
                        <span className="absolute right-1 bottom-1 rounded bg-foreground/60 px-1 py-0.5 text-[8px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100">
                          {(img.size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Add more slot */}
                  {slotsLeft > 0 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">{slotsLeft} left</span>
                    </button>
                  )}
                </div>
              )}

              {/* Progress bar */}
              {imageCount > 0 && (
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${(imageCount / MAX_IMAGES) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
                  </span>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  // Reset so selecting the same file works
                  e.target.value = "";
                }}
              />

              {imageCount === 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2.5">
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Good photos get 3× more responses. Add photos from multiple
                    angles.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="shrink-0 border-t border-border px-5 py-4">
          <div className="flex items-center gap-3">
            {step === "images" && (
              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}

            <div className="flex flex-1 justify-end gap-2.5">
              <button
                type="button"
                disabled={submitting || compressing || isDraftDisabled}
                onClick={() => handleSubmit(true)}
                className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Draft
              </button>

              {step === "details" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-black text-background shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
                >
                  Add Photos
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting || compressing || isPublishDisabled}
                  onClick={() => handleSubmit(false)}
                  className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-black text-background shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEdit ? "Updating..." : "Publishing..."}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {isEdit ? "Update" : "Publish"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── small helpers ── */
function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <label className="text-xs font-black uppercase tracking-wide text-foreground/70">
          {label}
        </label>
        {required && <span className="text-xs text-destructive">*</span>}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs font-semibold text-destructive">{error}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border ${hasError ? "border-destructive bg-destructive/5" : "border-border bg-card"} px-3 py-2.5 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:shadow-soft`;
}

function selectClass() {
  return "h-10 w-full rounded-xl border border-border bg-card text-sm font-semibold focus:border-primary";
}
