import { X, RotateCcw, Check } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MarketplaceFilters } from "@/types/marketplace";

interface PremiumFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
}

const categories = [
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "cycles", label: "Cycles" },
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing" },
  { value: "accessories", label: "Accessories" },
  { value: "free", label: "Free Items" },
  { value: "other", label: "Other" },
];

const conditions = [
  { value: "new", label: "Brand New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function PremiumFilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
}: PremiumFilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 100000,
  ]);

  const handleReset = () => {
    setLocalFilters({});
    setPriceRange([0, 100000]);
  };

  const handleApply = () => {
    onFiltersChange({
      ...localFilters,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
    });
    onClose();
  };

  const handleConditionToggle = (condition: string) => {
    const current = localFilters.condition || [];
    const updated = current.includes(condition as any)
      ? current.filter((c) => c !== condition)
      : [...current, condition as any];
    setLocalFilters({ ...localFilters, condition: updated.length > 0 ? updated : undefined });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-electric/5 p-4">
            <div>
              <h2 className="font-display text-xl font-black">Filters</h2>
              <p className="text-xs font-semibold text-muted-foreground">
                Refine your search
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card transition-all duration-200 hover:bg-secondary hover:shadow-soft"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Sort */}
            <FilterSection title="Sort By">
              <RadioGroup
                value={localFilters.sortBy || "newest"}
                onValueChange={(value) => setLocalFilters({ ...localFilters, sortBy: value as any })}
              >
                {sortOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 py-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer text-sm font-bold"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FilterSection>

            {/* Category */}
            <FilterSection title="Category">
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        category: localFilters.category === cat.value ? undefined : cat.value as any,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all duration-200 ${
                      localFilters.category === cat.value
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="text-sm font-bold">{cat.label}</span>
                    {localFilters.category === cat.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Price Range */}
            <FilterSection title="Price Range">
              <div className="space-y-4">
                <Slider
                  min={0}
                  max={100000}
                  step={500}
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                  <div className="text-center">
                    <p className="text-xs font-bold text-muted-foreground">Min</p>
                    <p className="font-display text-lg font-black">
                      ₹{priceRange[0].toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="h-px flex-1 bg-border mx-3" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-muted-foreground">Max</p>
                    <p className="font-display text-lg font-black">
                      ₹{priceRange[1].toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Condition */}
            <FilterSection title="Condition">
              <div className="space-y-2">
                {conditions.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => handleConditionToggle(cond.value)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                      localFilters.condition?.includes(cond.value as any)
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <Checkbox checked={localFilters.condition?.includes(cond.value as any)} />
                    <span className="text-sm font-bold">{cond.label}</span>
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Availability */}
            <FilterSection title="Availability">
              <button
                type="button"
                onClick={() =>
                  setLocalFilters({ ...localFilters, freeOnly: !localFilters.freeOnly })
                }
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                  localFilters.freeOnly
                    ? "border-success bg-success/10"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <Checkbox checked={localFilters.freeOnly} />
                <span className="text-sm font-bold">Free Items Only</span>
              </button>
            </FilterSection>

            {/* Verified Seller */}
            <FilterSection title="Seller">
              <button
                type="button"
                onClick={() =>
                  setLocalFilters({ ...localFilters, verifiedOnly: !localFilters.verifiedOnly })
                }
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                  localFilters.verifiedOnly
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <Checkbox checked={localFilters.verifiedOnly} />
                <span className="text-sm font-bold">Verified Sellers Only</span>
              </button>
            </FilterSection>
          </div>

          {/* Sticky Footer */}
          <div className="border-t border-border bg-card p-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-black transition-all duration-200 hover:bg-secondary hover:shadow-soft"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-black text-background shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
              >
                <Check className="h-4 w-4" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
