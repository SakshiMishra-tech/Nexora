import { X, RotateCcw, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { EnhancedMarketplaceFilters, SortOption, ListingCondition } from "@/types/marketplace-enhanced";

interface EnhancedFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: EnhancedMarketplaceFilters;
  onFiltersChange: (filters: EnhancedMarketplaceFilters) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "most-viewed", label: "Most Viewed" },
  { value: "recent", label: "Recently Added" },
  { value: "nearest", label: "Nearest First" },
];

const conditions: { value: ListingCondition; label: string }[] = [
  { value: "new", label: "Brand New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
];

const campusList = [
  "IIT Delhi",
  "IIT Bombay",
  "BITS Pilani",
  "NIT Trichy",
  "DTU Delhi",
  "NSUT Delhi",
];

const hostelsList = [
  "Hostel 1 - Boys",
  "Hostel 2 - Boys",
  "Hostel 3 - Girls",
  "Hostel 4 - Girls",
  "Hostel 5 - PG",
];

const departments = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Chemical",
  "Electrical",
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "PG"];

export function EnhancedFilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
}: EnhancedFilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 100000,
  ]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sort: true,
    category: false,
    price: true,
    condition: false,
    campus: false,
    hostel: false,
    department: false,
    year: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handleConditionToggle = (condition: ListingCondition) => {
    const current = localFilters.condition || [];
    const updated = current.includes(condition)
      ? current.filter((c) => c !== condition)
      : [...current, condition];
    setLocalFilters({ ...localFilters, condition: updated.length > 0 ? updated : undefined });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.sortBy && localFilters.sortBy !== "newest") count++;
    if (localFilters.category) count++;
    if (priceRange[0] > 0 || priceRange[1] < 100000) count++;
    if (localFilters.condition && localFilters.condition.length > 0) count++;
    if (localFilters.verifiedOnly) count++;
    if (localFilters.negotiableOnly) count++;
    if (localFilters.freeOnly) count++;
    if (localFilters.campus) count++;
    if (localFilters.hostel) count++;
    if (localFilters.department) count++;
    if (localFilters.year) count++;
    return count;
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
                {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? "s" : ""} applied
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
            <FilterSection
              title="Sort By"
              isExpanded={expandedSections.sort}
              onToggle={() => toggleSection("sort")}
            >
              <RadioGroup
                value={localFilters.sortBy || "newest"}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, sortBy: value as SortOption })
                }
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

            {/* Price Range */}
            <FilterSection
              title="Price Range"
              isExpanded={expandedSections.price}
              onToggle={() => toggleSection("price")}
            >
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
                  <div className="mx-3 h-px flex-1 bg-border" />
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
            <FilterSection
              title="Condition"
              isExpanded={expandedSections.condition}
              onToggle={() => toggleSection("condition")}
            >
              <div className="space-y-2">
                {conditions.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => handleConditionToggle(cond.value)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                      localFilters.condition?.includes(cond.value)
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <Checkbox checked={localFilters.condition?.includes(cond.value)} />
                    <span className="text-sm font-bold">{cond.label}</span>
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Quick Toggles */}
            <FilterSection title="Availability" isExpanded onToggle={() => {}}>
              <div className="space-y-2">
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

                <button
                  type="button"
                  onClick={() =>
                    setLocalFilters({ ...localFilters, negotiableOnly: !localFilters.negotiableOnly })
                  }
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                    localFilters.negotiableOnly
                      ? "border-accent bg-accent/10"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <Checkbox checked={localFilters.negotiableOnly} />
                  <span className="text-sm font-bold">Negotiable Only</span>
                </button>

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
              </div>
            </FilterSection>

            {/* Campus */}
            <FilterSection
              title="Campus"
              isExpanded={expandedSections.campus}
              onToggle={() => toggleSection("campus")}
            >
              <div className="space-y-2">
                {campusList.map((campus) => (
                  <button
                    key={campus}
                    type="button"
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        campus: localFilters.campus === campus ? undefined : campus,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all duration-200 ${
                      localFilters.campus === campus
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="text-sm font-bold">{campus}</span>
                    {localFilters.campus === campus && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Hostel */}
            <FilterSection
              title="Hostel"
              isExpanded={expandedSections.hostel}
              onToggle={() => toggleSection("hostel")}
            >
              <div className="space-y-2">
                {hostelsList.map((hostel) => (
                  <button
                    key={hostel}
                    type="button"
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        hostel: localFilters.hostel === hostel ? undefined : hostel,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all duration-200 ${
                      localFilters.hostel === hostel
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="text-sm font-bold">{hostel}</span>
                    {localFilters.hostel === hostel && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Department */}
            <FilterSection
              title="Department"
              isExpanded={expandedSections.department}
              onToggle={() => toggleSection("department")}
            >
              <div className="space-y-2">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        department: localFilters.department === dept ? undefined : dept,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all duration-200 ${
                      localFilters.department === dept
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="text-sm font-bold">{dept}</span>
                    {localFilters.department === dept && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Year */}
            <FilterSection
              title="Year"
              isExpanded={expandedSections.year}
              onToggle={() => toggleSection("year")}
            >
              <div className="grid grid-cols-2 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        year: localFilters.year === year ? undefined : year,
                      })
                    }
                    className={`flex items-center justify-center rounded-lg border p-3 text-sm font-bold transition-all duration-200 ${
                      localFilters.year === year
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
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

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function FilterSection({ title, children, isExpanded, onToggle }: FilterSectionProps) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        className="mb-3 flex w-full items-center justify-between text-xs font-black uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {isExpanded && <div className="space-y-2">{children}</div>}
    </div>
  );
}
