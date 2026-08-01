import { useState, useEffect, useRef, useMemo } from "react";
import {
  Menu,
  ChevronDown,
  BookOpen,
  Laptop,
  Bike,
  BedDouble,
  Shirt,
  NotebookPen,
  GraduationCap,
  Gamepad2,
  Music,
  Dribbble,
  Wrench,
  Search,
  X,
  TrendingUp,
  Heart,
  ChevronRight,
  Flame,
  Star,
  Sparkles,
  Trophy,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Emojis mapping for top bar
const TOP_BAR_ITEMS = [
  { label: "Books", emoji: "📚", dbCategories: ["Books"] },
  { label: "Electronics", emoji: "💻", dbCategories: ["Electronics"] },
  { label: "Cycles", emoji: "🚲", dbCategories: ["Cycles"] },
  { label: "Hostel Essentials", emoji: "🛏", dbCategories: ["Hostel Essentials"] },
  { label: "Fashion", emoji: "👕", dbCategories: ["Fashion"] },
  { label: "Notes", emoji: "📖", dbCategories: ["Notes"] },
  { label: "Academic", emoji: "🎓", dbCategories: ["Books", "Notes", "Stationery"] },
  { label: "Gaming", emoji: "🎮", dbCategories: ["Gaming"] },
  { label: "Hobbies", emoji: "🎸", dbCategories: ["Others", "Sports"] }
];

export interface Subcategory {
  name: string;
  query?: string;
  dbCategories?: string[];
}

export interface MegaCategory {
  id: string;
  name: string;
  emoji: string;
  icon: any;
  dbCategories: string[];
  subcategories: Subcategory[];
}

export const MEGA_CATEGORIES: MegaCategory[] = [
  {
    id: "academic",
    name: "Academic",
    emoji: "📚",
    icon: GraduationCap,
    dbCategories: ["Books", "Notes", "Stationery"],
    subcategories: [
      { name: "Notes", dbCategories: ["Notes"] },
      { name: "Textbooks", dbCategories: ["Books"], query: "textbook" },
      { name: "PYQs", dbCategories: ["Notes"], query: "pyq" },
      { name: "Lab Manuals", dbCategories: ["Notes", "Books"], query: "lab manual" },
      { name: "Stationery", dbCategories: ["Stationery"] }
    ]
  },
  {
    id: "electronics",
    name: "Electronics",
    emoji: "💻",
    icon: Laptop,
    dbCategories: ["Electronics"],
    subcategories: [
      { name: "Laptops", query: "laptop" },
      { name: "Phones", query: "phone" },
      { name: "Tablets", query: "tablet" },
      { name: "Headphones", query: "headphone" },
      { name: "Calculator", query: "calculator" },
      { name: "Chargers", query: "charger" },
      { name: "Smart Watches", query: "watch" }
    ]
  },
  {
    id: "hostel",
    name: "Hostel Essentials",
    emoji: "🛏",
    icon: BedDouble,
    dbCategories: ["Hostel Essentials", "Furniture"],
    subcategories: [
      { name: "Mattress", query: "mattress" },
      { name: "Chair", query: "chair" },
      { name: "Study Table", query: "table" },
      { name: "Bucket", query: "bucket" },
      { name: "Mirror", query: "mirror" },
      { name: "Lamp", query: "lamp" },
      { name: "Hangers", query: "hanger" }
    ]
  },
  {
    id: "transport",
    name: "Transport",
    emoji: "🚲",
    icon: Bike,
    dbCategories: ["Cycles"],
    subcategories: [
      { name: "Cycles", dbCategories: ["Cycles"] },
      { name: "Helmets", query: "helmet" },
      { name: "Bike Accessories", query: "accessory" }
    ]
  },
  {
    id: "fashion",
    name: "Fashion",
    emoji: "👕",
    icon: Shirt,
    dbCategories: ["Fashion"],
    subcategories: [
      { name: "Clothes", query: "clothes" },
      { name: "Shoes", query: "shoes" },
      { name: "Bags", query: "bag" },
      { name: "Watches", query: "watch" }
    ]
  },
  {
    id: "gaming",
    name: "Gaming",
    emoji: "🎮",
    icon: Gamepad2,
    dbCategories: ["Gaming"],
    subcategories: [
      { name: "Consoles", query: "console" },
      { name: "Controllers", query: "controller" },
      { name: "Games", query: "game" }
    ]
  },
  {
    id: "sports",
    name: "Sports",
    emoji: "🏸",
    icon: Trophy,
    dbCategories: ["Sports"],
    subcategories: [
      { name: "Cricket", query: "cricket" },
      { name: "Football", query: "football" },
      { name: "Badminton", query: "badminton" },
      { name: "Gym Equipment", query: "gym" }
    ]
  },
  {
    id: "hobbies",
    name: "Hobbies",
    emoji: "🎵",
    icon: Music,
    dbCategories: ["Others"],
    subcategories: [
      { name: "Musical Instruments", query: "instrument" },
      { name: "Cameras", query: "camera" },
      { name: "Art Supplies", query: "art" }
    ]
  },
  {
    id: "services",
    name: "Services",
    emoji: "🛠",
    icon: Wrench,
    dbCategories: ["Others"],
    subcategories: [
      { name: "Tutoring", query: "tutor" },
      { name: "Printing", query: "print" },
      { name: "Repairs", query: "repair" }
    ]
  }
];

interface CategoryNavigationProps {
  activeCategories: string[];
  activeQuery: string;
  onSelectCategory: (categories: string[], query?: string) => void;
  onSelectQuickFilter?: (filterId: string) => void;
}

export function CategoryNavigation({
  activeCategories,
  activeQuery,
  onSelectCategory,
  onSelectQuickFilter
}: CategoryNavigationProps) {
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [megaSearch, setMegaSearch] = useState("");
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  // Click outside listener for desktop Mega Menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMegaOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation (Escape key to close)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMegaOpen(false);
        setIsMobileOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter categories based on search input inside Mega Menu
  const filteredMegaCategories = useMemo(() => {
    if (!megaSearch.trim()) return MEGA_CATEGORIES;
    const query = megaSearch.toLowerCase();
    return MEGA_CATEGORIES.map((cat) => {
      const matchCat = cat.name.toLowerCase().includes(query);
      const filteredSubs = cat.subcategories.filter((sub) =>
        sub.name.toLowerCase().includes(query)
      );
      if (matchCat || filteredSubs.length > 0) {
        return {
          ...cat,
          subcategories: matchCat ? cat.subcategories : filteredSubs
        };
      }
      return null;
    }).filter(Boolean) as MegaCategory[];
  }, [megaSearch]);

  const handleItemClick = (dbCats: string[], query?: string) => {
    onSelectCategory(dbCats, query);
    setIsMegaOpen(false);
    setIsMobileOpen(false);
    setMegaSearch("");
  };

  const isTabActive = (itemDbCats: string[]) => {
    if (activeCategories.length === 0) return false;
    return itemDbCats.some(cat => activeCategories.includes(cat));
  };

  return (
    <div ref={containerRef} className="relative z-40 w-full border-b border-border bg-paper/95 backdrop-blur-md sticky top-[57px]">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
        
        {/* Left Side: All Categories Trigger */}
        <div className="flex items-center gap-2 py-3 border-r border-border/50 pr-4">
          {/* Desktop Trigger */}
          <button
            onClick={() => setIsMegaOpen(!isMegaOpen)}
            className={`hidden md:flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-all hover:bg-secondary ${
              isMegaOpen ? "bg-secondary text-primary" : "text-foreground"
            }`}
          >
            <Menu className="h-4 w-4" />
            <span>All Categories</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isMegaOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Mobile/Tablet Trigger */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex md:hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-foreground transition-all hover:bg-secondary"
          >
            <Menu className="h-4 w-4" />
            <span>Categories</span>
          </button>
        </div>

        {/* Scrollable horizontal top navigation bar items */}
        <div className="flex-1 flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TOP_BAR_ITEMS.map((item) => {
            const active = isTabActive(item.dbCategories) && (!activeQuery || item.dbCategories.length > 1);
            return (
              <button
                key={item.label}
                onClick={() => handleItemClick(item.dbCategories)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4.5 py-1.5 text-xs font-black transition-all duration-200 hover:-translate-y-0.5 ${
                  active
                    ? "border-foreground bg-foreground text-background shadow-soft"
                    : "border-border bg-card/60 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                }`}
              >
                <span>{item.emoji}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ── DESKTOP MEGA MENU ── */}
      {isMegaOpen && (
        <div className="absolute left-0 right-0 top-full border-t border-border bg-paper shadow-mega animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-6">
            
            {/* Top Quick Access panel */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 border-b border-border/40 pb-5 items-center">
              
              {/* Category Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories & subcategories..."
                  value={megaSearch}
                  onChange={(e) => setMegaSearch(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary/50 transition-colors"
                />
                {megaSearch && (
                  <button onClick={() => setMegaSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filters / Trending Row */}
              <div className="md:col-span-3 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                  <span>Trending:</span>
                  <button onClick={() => handleItemClick(["Electronics"], "macbook")} className="hover:text-foreground font-black underline decoration-primary/30">macbook</button>
                  <span className="text-border">•</span>
                  <button onClick={() => handleItemClick(["Cycles"])} className="hover:text-foreground font-black underline decoration-primary/30">cycle</button>
                  <span className="text-border">•</span>
                  <button onClick={() => handleItemClick(["Books"], "textbook")} className="hover:text-foreground font-black underline decoration-primary/30">textbook</button>
                </div>
                
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold ml-auto">
                  <Heart className="h-3.5 w-3.5 text-warm" />
                  <span>Popular:</span>
                  <button onClick={() => handleItemClick(["Hostel Essentials"])} className="hover:text-foreground font-black">Hostel</button>
                  <span className="text-border">•</span>
                  <button onClick={() => handleItemClick(["Academic"])} className="hover:text-foreground font-black">Academic</button>
                </div>
              </div>

            </div>

            {/* 4-5 Columns Subcategory Matrix */}
            {filteredMegaCategories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
                {filteredMegaCategories.map((cat) => {
                  const IconComponent = cat.icon;
                  const isCatActive = isTabActive(cat.dbCategories);
                  return (
                    <div key={cat.id} className="flex flex-col gap-3 group">
                      
                      {/* Main Category Header */}
                      <button
                        onClick={() => handleItemClick(cat.dbCategories)}
                        className={`flex items-center gap-2 font-black text-sm text-left pb-1 border-b border-border/40 transition-all hover:text-primary ${
                          isCatActive ? "text-primary border-primary/20" : "text-foreground"
                        }`}
                      >
                        <span className="p-1 rounded bg-secondary text-primary transition-transform group-hover:scale-110">
                          <IconComponent className="h-4 w-4" />
                        </span>
                        <span>{cat.name}</span>
                      </button>

                      {/* Subcategories list */}
                      <ul className="flex flex-col gap-1.5">
                        {cat.subcategories.map((sub) => (
                          <li key={sub.name}>
                            <button
                              onClick={() => handleItemClick(sub.dbCategories ?? cat.dbCategories, sub.query)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 hover:translate-x-1 py-0.5 w-full text-left font-semibold"
                            >
                              <ChevronRight className="h-3 w-3 opacity-0 hover:opacity-100 transition-opacity text-primary" />
                              <span>{sub.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm font-semibold">
                No matching categories found for "{megaSearch}"
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── MOBILE ACCORDION BOTTOM SHEET ── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          
          {/* Dismiss tap area */}
          <div className="absolute inset-0" onClick={() => setIsMobileOpen(false)} />

          {/* Bottom Sheet Container */}
          <div
            ref={mobileSheetRef}
            className="relative w-full max-h-[85vh] bg-paper rounded-t-[2rem] border-t border-border flex flex-col shadow-mega animate-in slide-in-from-bottom duration-300 z-10"
          >
            
            {/* Header / Drag indicator */}
            <div className="flex flex-col items-center py-4 border-b border-border/40 px-4 shrink-0">
              <div className="w-12 h-1 bg-secondary-foreground/20 rounded-full mb-3" />
              <div className="flex items-center justify-between w-full">
                <span className="font-display font-black text-lg">Browse Categories</span>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content with Scroll */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={megaSearch}
                  onChange={(e) => setMegaSearch(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-primary/50"
                />
              </div>

              {/* Accordion Categories */}
              <div className="space-y-2">
                {filteredMegaCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isExpanded = expandedMobileCat === cat.id;
                  return (
                    <div key={cat.id} className="border border-border/50 rounded-2xl overflow-hidden bg-card/40">
                      
                      {/* Main Cat button */}
                      <button
                        onClick={() => setExpandedMobileCat(isExpanded ? null : cat.id)}
                        className="flex items-center justify-between w-full p-4 font-black text-sm text-left hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-lg bg-secondary text-primary">
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span>{cat.name}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Sub categories */}
                      {isExpanded && (
                        <div className="bg-paper/50 border-t border-border/40 px-4 py-2 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleItemClick(cat.dbCategories)}
                            className="text-xs font-bold text-primary hover:bg-primary/5 rounded-xl py-2 px-3 text-left transition-colors flex items-center gap-1.5"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>All {cat.name}</span>
                          </button>
                          
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub.name}
                              onClick={() => handleItemClick(sub.dbCategories ?? cat.dbCategories, sub.query)}
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl py-2 px-3 text-left hover:bg-secondary/40 transition-colors"
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
