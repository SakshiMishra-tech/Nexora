import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Zap, ShieldCheck, Tag } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export type QuickFilterOption =
  | "all"
  | "latest"
  | "electronics"
  | "books"
  | "cycles"
  | "furniture"
  | "hostel"
  | "free"
  | "negotiable"
  | "verified"
  | "under1k"
  | "new-today";

interface QuickFilterChipsProps {
  selected: QuickFilterOption;
  onSelect: (filter: QuickFilterOption) => void;
}

interface FilterChip {
  id: QuickFilterOption;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

const filterChips: FilterChip[] = [
  { id: "all", label: "All", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: "latest", label: "Latest", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "electric" },
  { id: "electronics", label: "Electronics" },
  { id: "books", label: "Books" },
  { id: "cycles", label: "Cycles" },
  { id: "furniture", label: "Furniture" },
  { id: "hostel", label: "Hostel Essentials" },
  { id: "free", label: "Free", icon: <Tag className="h-3.5 w-3.5" />, color: "success" },
  { id: "negotiable", label: "Negotiable" },
  { id: "verified", label: "Verified Seller", icon: <ShieldCheck className="h-3.5 w-3.5" />, color: "primary" },
  { id: "under1k", label: "Under ₹1000", color: "warm" },
  { id: "new-today", label: "New Today", icon: <Zap className="h-3.5 w-3.5" />, color: "warm" },
];

export function QuickFilterChips({ selected, onSelect }: QuickFilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const getChipStyles = (chip: FilterChip, isSelected: boolean) => {
    if (isSelected) {
      switch (chip.color) {
        case "electric":
          return "bg-electric text-electric-foreground border-electric shadow-glow";
        case "success":
          return "bg-success text-success-foreground border-success shadow-glow";
        case "warm":
          return "bg-warm text-warm-foreground border-warm shadow-warm";
        case "primary":
          return "bg-primary text-primary-foreground border-primary shadow-glow";
        default:
          return "bg-foreground text-background border-foreground shadow-soft";
      }
    }
    return "bg-card text-foreground border-border hover:bg-secondary hover:border-primary/30";
  };

  return (
    <div className="relative">
      {/* Left Scroll Arrow */}
      {showLeftArrow && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-paper shadow-soft transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-1/2 hover:shadow-glow"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Scrollable Chips Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {filterChips.map((chip) => {
          const isSelected = selected === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelect(chip.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-black transition-all duration-200 hover:-translate-y-0.5 ${getChipStyles(
                chip,
                isSelected
              )}`}
            >
              {chip.icon}
              <span className="whitespace-nowrap">{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Scroll Arrow */}
      {showRightArrow && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-paper shadow-soft transition-all duration-200 hover:translate-x-0.5 hover:-translate-y-1/2 hover:shadow-glow"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Hide scrollbar globally for this component */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
