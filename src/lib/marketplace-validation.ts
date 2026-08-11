import { z } from "zod";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  type ListingFormValues,
} from "./marketplace";

// Blacklist of garbage title patterns/words
const TITLE_BLACKLIST = ["asdf", "test", "abc", "done", "item", "hello", "qwerty", "12345", "aaaaaa"];

// List of product keywords to verify listing authenticity
const PRODUCT_KEYWORDS = new Set([
  "book", "books", "textbook", "textbooks", "notebook", "notebooks", "notes", "novel", "novels",
  "laptop", "laptops", "macbook", "computer", "pc", "monitor", "monitors", "mouse", "keyboard",
  "keyboards", "charger", "adapter", "cable", "cables", "screen", "display", "ipad", "tablet",
  "phone", "mobile", "smartphone", "iphone", "samsung", "oneplus", "xiaomi", "redmi", "realme",
  "headphone", "headphones", "earphone", "earphones", "earbuds", "airpods", "speaker", "speakers",
  "calculator", "calc", "casio", "watch", "smartwatch",
  "chair", "chairs", "table", "tables", "desk", "desks", "bed", "mattress", "pillow", "pillows",
  "curtain", "curtains", "mirror", "wardrobe", "cupboard", "shelf", "shelves", "rack", "racks",
  "fan", "cooler", "coolers", "kettle", "kettles", "induction", "cooker", "heater", "iron",
  "cycle", "bicycle", "cycles", "bicycles", "bike", "bikes", "helmet", "helmets",
  "hoodie", "hoodies", "jacket", "jackets", "shirt", "shirts", "tshirt", "tshirts", "jeans",
  "pants", "trousers", "shoes", "sneakers", "bag", "bags", "backpack", "backpacks",
  "bat", "ball", "racket", "rackets", "kit", "jersey", "dumbbells", "dumbbell", "mat",
  "lamp", "light", "lights", "bulb", "bulbs", "torch", "extension", "board",
  "drafter", "t-square", "compass", "drawing", "apron", "coat", "lab", "coat", "microscope"
]);

export function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isGarbageWord(word: string): boolean {
  const cleaned = cleanWord(word);
  if (cleaned.length <= 1) return true;
  if (TITLE_BLACKLIST.includes(cleaned)) return true;
  if (/^(.)\1+$/.test(cleaned)) return true; // Repetitive (e.g. "aaaaa")
  if (cleaned.includes("asdf") || cleaned.includes("qwerty") || cleaned.includes("zxcv")) return true;
  if (/^[0-9]+$/.test(cleaned) && cleaned.length >= 4) return true; // Numeric spam
  return false;
}

// ── Title Schema ──
export const titleSchema = z.string()
  .min(1, "Title is required.")
  .min(5, "Title is too short. Minimum 5 characters.")
  .max(80, "Title is too long. Maximum 80 characters.")
  .refine((val) => {
    const words = val.trim().split(/\s+/).filter(Boolean);
    const meaningfulWords = words.filter(w => !isGarbageWord(w));
    const hasKeyword = words.some(w => PRODUCT_KEYWORDS.has(cleanWord(w)));
    return meaningfulWords.length >= 2 || hasKeyword;
  }, "Please enter a meaningful title (e.g. Brand + Product name).");

// ── Description Schema ──
export const descriptionSchema = z.string()
  .min(1, "Description is required.")
  .min(25, "Description is too short. Minimum 25 characters.")
  .max(1000, "Description is too long. Maximum 1000 characters.")
  .refine((val) => {
    const lowercase = val.toLowerCase();
    const blacklistedSpam = ["asdfasdf", "qwerty", "hello", "aaaaaaaa"];
    return !blacklistedSpam.some(spam => lowercase.includes(spam));
  }, "Description contains invalid or spam content.")
  .refine((val) => {
    return !/(.)\1{7,}/.test(val.toLowerCase());
  }, "Description contains too many repeated characters.")
  .refine((val) => {
    const words = val.trim().split(/\s+/).filter(Boolean);
    return words.length >= 4;
  }, "Description should explain the item's condition in meaningful sentences.");

// ── Pickup Location Schema ──
export const pickupAreaSchema = z.string()
  .min(1, "Pickup location is required.")
  .min(5, "Pickup location looks incomplete. Please specify a landmark.")
  .refine((val) => {
    const lowercase = val.toLowerCase().trim();
    const blacklist = ["abc", "123", "test", "asdf"];
    return !blacklist.includes(lowercase) && !/^(.)\1+$/.test(lowercase);
  }, "Please enter a specific, real pickup location (e.g. Gate 2, Hostel A).");

// ── Specifications Validation ──
export function parseAndValidateSpecifications(specsStr: string): { error?: string; cleaned?: string } {
  if (!specsStr || !specsStr.trim()) return { cleaned: "" };

  const entries = specsStr.split(",").map(e => e.trim()).filter(Boolean);
  if (entries.length > 15) {
    return { error: "Maximum 15 specification entries allowed." };
  }

  const seenKeys = new Set<string>();
  const cleanedEntries: string[] = [];

  for (const entry of entries) {
    if (entry.length > 60) {
      return { error: "Each specification entry must be under 60 characters." };
    }

    const colonIndex = entry.indexOf(":");
    if (colonIndex === -1) {
      const key = entry.trim().toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        cleanedEntries.push(entry);
      }
    } else {
      const key = entry.substring(0, colonIndex).trim().toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        cleanedEntries.push(entry);
      }
    }
  }

  return {
    cleaned: cleanedEntries.join(", "),
  };
}

// ── Tags Validation ──
export function parseAndValidateTags(tagsStr: string): { error?: string; cleaned?: string } {
  if (!tagsStr || !tagsStr.trim()) return { cleaned: "" };

  const rawTags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
  const seenTags = new Set<string>();
  const cleanedTags: string[] = [];

  for (const tag of rawTags) {
    if (tag.length < 2 || tag.length > 20) {
      return { error: "Each tag must be between 2 and 20 characters." };
    }
    const lowerTag = tag.toLowerCase();
    if (!seenTags.has(lowerTag)) {
      seenTags.add(lowerTag);
      cleanedTags.push(tag);
    }
  }

  if (cleanedTags.length > 5) {
    return { error: "Maximum 5 tags allowed." };
  }

  return {
    cleaned: cleanedTags.join(", "),
  };
}

// ── Images Validation ──
export function validateImages(images: (File | string)[], isDraft: boolean): string | undefined {
  if (!isDraft && images.length === 0) {
    return "Please upload at least one image.";
  }
  if (images.length > 12) {
    return "You can upload a maximum of 12 images.";
  }

  const seen = new Set<string>();
  for (const img of images) {
    let key: string;
    if (typeof img === "string") {
      key = img;
    } else {
      if (!img || !img.type) return "Invalid image format. Please re-upload your images.";
      key = `${img.name}-${img.size}`;
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
      if (!allowedTypes.includes(img.type.toLowerCase())) {
        return `Unsupported format: ${img.name}.`;
      }
      if (img.size > 5 * 1024 * 1024) {
        return `Image ${img.name} exceeds 5 MB limit.`;
      }
    }

    if (seen.has(key)) {
      return "Duplicate images are not allowed.";
    }
    seen.add(key);
  }
  return undefined;
}

// ── Main Listing Form Schema Builder & Validator ──
export function validateListingForm(
  values: ListingFormValues,
  isDraft: boolean
): { isValid: boolean; errors: Partial<Record<keyof ListingFormValues, string>> } {
  const errors: Partial<Record<keyof ListingFormValues, string>> = {};

  // 1. Title validation
  const titleRes = titleSchema.safeParse(values.title);
  if (!titleRes.success) {
    errors.title = titleRes.error.errors[0].message;
  }

  // 2. Description validation
  const descRes = descriptionSchema.safeParse(values.description);
  if (!descRes.success) {
    errors.description = descRes.error.errors[0].message;
  }

  // 3. Category & Condition validation
  if (!values.category || !MARKETPLACE_CATEGORIES.includes(values.category)) {
    errors.category = "Please select a valid category.";
  }
  if (!values.condition || !MARKETPLACE_CONDITIONS.includes(values.condition)) {
    errors.condition = "Please select a valid condition.";
  }

  // 4. Price and Original Price validation
  const price = Number(values.price);
  if (values.price === "" || isNaN(price) || price < 0) {
    errors.price = "Enter a valid price (0 or greater).";
  }

  if (values.originalPrice) {
    const originalPrice = Number(values.originalPrice);
    if (isNaN(originalPrice) || originalPrice < 0) {
      errors.originalPrice = "Enter a valid original price.";
    } else if (originalPrice > 0 && originalPrice < price) {
      errors.originalPrice = "Original price cannot be smaller than selling price.";
    }
  }

  // 5. Pickup Location (conditional based on draft)
  if (!isDraft) {
    const pickupRes = pickupAreaSchema.safeParse(values.pickupArea);
    if (!pickupRes.success) {
      errors.pickupArea = pickupRes.error.errors[0].message;
    }
  } else if (values.pickupArea.trim()) {
    const pickupRes = pickupAreaSchema.safeParse(values.pickupArea);
    if (!pickupRes.success) {
      errors.pickupArea = pickupRes.error.errors[0].message;
    }
  }

  // 6. Specifications Validation
  if (values.specifications) {
    const specsValidation = parseAndValidateSpecifications(values.specifications);
    if (specsValidation.error) {
      errors.specifications = specsValidation.error;
    }
  }

  // 7. Tags Validation
  if (values.tags) {
    const tagsValidation = parseAndValidateTags(values.tags);
    if (tagsValidation.error) {
      errors.tags = tagsValidation.error;
    }
  }

  // 8. Images Validation
  const imgErr = validateImages(values.images, isDraft);
  if (imgErr) {
    errors.images = imgErr;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
