import { Filter, X, Search, Sliders } from "lucide-react";
import { useState } from "react";
import type { MarketplaceFilters, ListingCategory, ListingCondition } from "@/types/marketplace";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface FilterSidebarProps {
  filters: MarketplaceFilters;
  onFilterChange: (filters: MarketplaceFilters) => void;
  onClearFilters: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const categories: { value: ListingCategory; label: string }[] = [
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "cycles", label: "Cycles" },
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing" },
  { value: "accessories", label: "Accessories" },
  { value: "free", label: "Free Items" },
  { value: "other", label: "Other" },
];

const conditions: { value: ListingCondition; label: string }[] = [
  { value: "new", label: "Brand New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
];

export function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  isMobile = false,
  onClose,
}: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 100000,
  ]);
  const [locationSearch, setLocationSearch] = useState(filters.location || "");

  const hasActiveFilters =
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.condition?.length ||
    filters.location ||
    filters.freeOnly;

  const handleCategoryChange = (category: ListingCategory) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handleConditionToggle = (condition: ListingCondition) => {
    const currentConditions = filters.condition || [];
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter((c) => c !== condition)
      : [...currentConditions, condition];

    onFilterChange({
      ...filters,
      condition: newConditions.length > 0 ? newConditions : undefined,
    });
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
    onFilterChange({
      ...filters,
      minPrice: values[0] > 0 ? values[0] : undefined,
      maxPrice: values[1] < 100000 ? values[1] : undefined,
    });
  };

  const handleLocationChange = (value: string) => {
    setLocationSearch(value);
    onFilterChange({
      ...filters,
      location: value.trim() || undefined,
    });
  };

  return (
    <aside
      className={`${
        isMobile
          ? "fixed inset-0 z-50 bg-background overflow-y-auto"
          : "sticky top-20 h-fit"
      } border border-border bg-card shadow-soft`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-black">
            <Sliders className="h-4 w-4 text-primary" />
            <span>Filters</span>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
            {isMobile && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition-colors"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Location Search */}
        <div className="mb-4">
          <Label htmlFor="location-search" className="text-xs font-black uppercase text-muted-foreground mb-2 block">
            Location
          </Label>
          <div className="rounded-2xl border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-sm font-black mb-2">
              <Search className="h-4 w-4 text-primary" />
              <span>Search campus</span>
            </div>
            <input
              id="location-search"
              value={locationSearch}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Hostel, Block, Area..."
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <Label className="text-xs font-black uppercase text-muted-foreground mb-3 block">
            Price Range
          </Label>
          <div className="px-2">
            <Slider
              min={0}
              max={100000}
              step={500}
              value={priceRange}
              onValueChange={handlePriceChange}
              className="mb-3"
            />
            <div className="flex items-center justify-between text-sm font-bold">
              <span>₹{priceRange[0].toLocaleString("en-IN")}</span>
              <span className="text-muted-foreground">to</span>
              <span>₹{priceRange[1].toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  freeOnly: !filters.freeOnly,
                })
              }
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-bold transition-colors ${
                filters.freeOnly
                  ? "bg-success/10 text-success border border-success"
                  : "bg-background border border-border hover:bg-secondary"
              }`}
            >
              <Checkbox checked={filters.freeOnly} />
              <span>Free items only</span>
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <Label className="text-xs font-black uppercase text-muted-foreground mb-2 block">
            Category
          </Label>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm font-bold transition-all duration-200 ${
                  filters.category === cat.value
                    ? "bg-primary text-primary-foreground shadow-soft border border-primary"
                    : "border border-border bg-background hover:bg-secondary hover:border-primary/30"
                }`}
              >
                <span>{cat.label}</span>
                {filters.category === cat.value && <Filter className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <Label className="text-xs font-black uppercase text-muted-foreground mb-2 block">
            Condition
          </Label>
          <div className="space-y-2">
            {conditions.map((cond) => {
              const isSelected = filters.condition?.includes(cond.value);
              return (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => handleConditionToggle(cond.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-bold transition-all duration-200 ${
                    isSelected
                      ? "bg-accent text-accent-foreground border border-accent"
                      : "bg-background border border-border hover:bg-secondary"
                  }`}
                >
                  <Checkbox checked={isSelected} />
                  <span>{cond.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
