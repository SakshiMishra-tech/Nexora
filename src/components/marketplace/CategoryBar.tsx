import { useRef, useState, useEffect } from "react";
import {
  Armchair,
  BedDouble,
  Bike,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Gift,
  Laptop,
  Microscope,
  NotebookPen,
  Package,
  PencilRuler,
  Shirt,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/**
 * CategoryId is a string to accommodate dynamic categories loaded from the DB.
 * Known values: "All" | "Books" | "Electronics" | "Furniture" | "Cycles" |
 * "Hostel Essentials" | "Gaming" | "Lab Equipment" | "Fashion" |
 * "Notes" | "Free Items" | "Sports" | "Stationery" | "Others"
 */
export type CategoryId = string;

/** Icon map for known category names */
const ICON_MAP: Record<string, LucideIcon> = {
  All: Sparkles,
  Electronics: Laptop,
  Books: BookOpen,
  Cycles: Bike,
  "Hostel Essentials": BedDouble,
  Furniture: Armchair,
  Gaming: Gamepad2,
  "Lab Equipment": Microscope,
  Notes: NotebookPen,
  Fashion: Shirt,
  Sports: Trophy,
  Stationery: PencilRuler,
  "Free Items": Gift,
  Others: Package,
};

/** Hardcoded fallback when DB categories haven't loaded */
const FALLBACK_CATEGORIES: { id: CategoryId; icon: LucideIcon }[] = [
  { id: "All", icon: Sparkles },
  { id: "Electronics", icon: Laptop },
  { id: "Books", icon: BookOpen },
  { id: "Cycles", icon: Bike },
  { id: "Hostel Essentials", icon: BedDouble },
  { id: "Furniture", icon: Armchair },
  { id: "Gaming", icon: Gamepad2 },
  { id: "Lab Equipment", icon: Microscope },
  { id: "Notes", icon: NotebookPen },
  { id: "Fashion", icon: Shirt },
  { id: "Sports", icon: Trophy },
  { id: "Stationery", icon: PencilRuler },
  { id: "Free Items", icon: Gift },
  { id: "Others", icon: Package },
];

interface CategoryBarProps {
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
  /** Dynamic categories loaded from marketplace_categories table */
  dbCategories?: string[];
  /** Shows skeleton loading state while categories are being fetched */
  isLoadingCategories?: boolean;
}

export function CategoryBar({
  selected,
  onSelect,
  dbCategories,
  isLoadingCategories = false,
}: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkArrows();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkArrows, { passive: true });
    window.addEventListener("resize", checkArrows);
    return () => {
      el?.removeEventListener("scroll", checkArrows);
      window.removeEventListener("resize", checkArrows);
    };
  }, []);

  // Re-check arrows when DB categories load (changes list length)
  useEffect(() => {
    const id = setTimeout(checkArrows, 50);
    return () => clearTimeout(id);
  }, [dbCategories]);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  // Build the category list from DB names (if available) or fallback
  const categories: { id: CategoryId; icon: LucideIcon }[] = (() => {
    if (!dbCategories || dbCategories.length === 0) {
      return FALLBACK_CATEGORIES;
    }
    // Always show "All" first, then DB categories with mapped icons
    return [
      { id: "All", icon: Sparkles },
      ...dbCategories.map((name) => ({
        id: name,
        icon: ICON_MAP[name] ?? Package,
      })),
    ];
  })();

  return (
    <div className="relative border-b border-border bg-paper">
      {/* Left arrow */}
      {showLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border border-border bg-paper shadow-soft transition-all hover:-translate-x-0.5 hover:-translate-y-1/2 hover:shadow-glow"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Chips */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: "none" }}
        onScroll={checkArrows}
      >
        {isLoadingCategories ? (
          /* Loading skeleton chips */
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-28 shrink-0 animate-pulse rounded-full border border-border bg-card"
            />
          ))
        ) : (
          categories.map((cat) => {
            const isSelected = selected === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition-all duration-200 hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-foreground bg-foreground text-background shadow-soft"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-soft"
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full ${isSelected ? "bg-background/10" : "bg-secondary text-primary"}`}
                  aria-hidden="true"
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <span className="whitespace-nowrap">{cat.id}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Right arrow */}
      {showRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border border-border bg-paper shadow-soft transition-all hover:translate-x-0.5 hover:-translate-y-1/2 hover:shadow-glow"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
