import { X, Check, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_SORTS,
  initialFilters,
  type MarketplaceFilters,
  type MarketplaceCategory,
  type MarketplaceCondition,
  type MarketplaceSort,
} from "@/lib/marketplace";

interface PremiumFilterProps {
  open: boolean;
  onClose: () => void;
  filters: MarketplaceFilters;
  onApply: (filters: MarketplaceFilters) => void;
}

const MAIN_CATEGORIES: MarketplaceCategory[] = [
  "Books", "Electronics", "Cycles", "Hostel Essentials",
  "Fashion", "Notes", "Gaming",
];

export function PremiumFilter({ open, onClose, filters, onApply }: PremiumFilterProps) {
  const [local, setLocal] = useState<MarketplaceFilters>(filters);
  const [price, setPrice] = useState([filters.minPrice, filters.maxPrice]);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLocal(filters);
      setPrice([filters.minPrice, filters.maxPrice]);
    }
  }, [open, filters]);

  // Trap keyboard
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleApply = () => {
    onApply({ ...local, minPrice: price[0], maxPrice: price[1] });
    onClose();
  };

  const handleClear = () => {
    setLocal({ ...initialFilters, query: filters.query });
    setPrice([0, 60000]);
  };

  const toggleCategory = (cat: MarketplaceCategory) => {
    setLocal(prev => ({
      ...prev,
      category: prev.category.includes(cat)
        ? prev.category.filter(c => c !== cat)
        : [...prev.category, cat],
    }));
  };

  const toggleCondition = (cond: MarketplaceCondition) => {
    setLocal(prev => ({
      ...prev,
      condition: prev.condition.includes(cond)
        ? prev.condition.filter(c => c !== cond)
        : [...prev.condition, cond],
    }));
  };

  const activeCount = [
    local.category.length > 0,
    local.condition.length > 0,
    price[0] > 0 || price[1] < 60000,
    local.sort !== "Newest",
    local.isNegotiable,
  ].filter(Boolean).length;

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[520px] mx-4 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Filters</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[60vh] [scrollbar-width:thin] divide-y divide-border">

          {/* Category */}
          <section className="px-6 py-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {MAIN_CATEGORIES.map(cat => {
                const active = local.category.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground/30"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Price Range */}
          <section className="px-6 py-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-5">
              Price Range
            </h3>
            <Slider
              min={0}
              max={60000}
              step={500}
              value={price}
              onValueChange={setPrice}
              className="mb-5"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Min</p>
                <p className="text-sm font-semibold text-foreground">
                  ₹{price[0].toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Max</p>
                <p className="text-sm font-semibold text-foreground">
                  ₹{price[1].toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </section>

          {/* Condition — pill toggle */}
          <section className="px-6 py-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Condition
            </h3>
            <div className="flex flex-wrap gap-2">
              {(["New", "Like new", "Good", "Fair", "Used"] as MarketplaceCondition[]).map(cond => {
                const active = local.condition.includes(cond);
                return (
                  <button
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground/30"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {cond}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sort — dropdown */}
          <section className="px-6 py-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Sort By
            </h3>
            <div className="relative">
              <select
                value={local.sort}
                onChange={e =>
                  setLocal(prev => ({ ...prev, sort: e.target.value as MarketplaceSort }))
                }
                className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm font-medium text-foreground outline-none focus:border-foreground/30 transition-colors cursor-pointer"
              >
                {MARKETPLACE_SORTS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </section>

          {/* Negotiable toggle */}
          <section className="px-6 py-5">
            <button
              onClick={() => setLocal(prev => ({ ...prev, isNegotiable: !prev.isNegotiable }))}
              className="flex items-center justify-between w-full"
            >
              <div>
                <p className="text-sm font-semibold text-foreground text-left">Negotiable only</p>
                <p className="text-xs text-muted-foreground text-left mt-0.5">
                  Show only listings open to offers
                </p>
              </div>
              {/* Toggle pill */}
              <div
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                  local.isNegotiable ? "bg-foreground" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-background shadow-sm transition-transform duration-200 ${
                    local.isNegotiable ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </div>
            </button>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card">
          <button
            onClick={handleClear}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {activeCount > 0 ? `Clear all (${activeCount})` : "Clear all"}
          </button>
          <button
            onClick={handleApply}
            className="px-7 py-2.5 bg-foreground text-background text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
