import { Search, TrendingUp, Clock, Tag, User } from "lucide-react";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const trendingSearches = [
  "Laptop",
  "Cycle",
  "Books",
  "Furniture",
  "Calculator",
];

const recentSearches = [
  "ThinkPad",
  "Engineering books",
  "Hostel furniture",
];

const categorySuggestions = [
  { name: "Electronics", count: 45 },
  { name: "Books", count: 128 },
  { name: "Cycles", count: 23 },
  { name: "Furniture", count: 67 },
];

export function SearchSuggestions({ query, onSelect, onClose }: SearchSuggestionsProps) {
  const hasQuery = query.trim().length > 0;

  // Filter suggestions based on query
  const filteredTrending = hasQuery
    ? trendingSearches.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : trendingSearches;

  const filteredCategories = hasQuery
    ? categorySuggestions.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : categorySuggestions;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-glow animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="max-h-[400px] overflow-y-auto">
        {/* Instant Matches */}
        {hasQuery && (
          <div className="border-b border-border p-3">
            <button
              type="button"
              onClick={() => onSelect(query)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-200 hover:bg-secondary"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{query}</p>
                <p className="text-xs font-semibold text-muted-foreground">Search for "{query}"</p>
              </div>
            </button>
          </div>
        )}

        {/* Recent Searches */}
        {!hasQuery && recentSearches.length > 0 && (
          <div className="border-b border-border p-3">
            <div className="mb-2 flex items-center gap-2 px-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-black uppercase text-muted-foreground">Recent</span>
            </div>
            <div className="space-y-1">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  type="button"
                  onClick={() => onSelect(search)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-200 hover:bg-secondary"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending Searches */}
        {filteredTrending.length > 0 && (
          <div className="border-b border-border p-3">
            <div className="mb-2 flex items-center gap-2 px-2">
              <TrendingUp className="h-3.5 w-3.5 text-warm" />
              <span className="text-xs font-black uppercase text-muted-foreground">Trending</span>
            </div>
            <div className="space-y-1">
              {filteredTrending.map((search) => (
                <button
                  key={search}
                  type="button"
                  onClick={() => onSelect(search)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-200 hover:bg-secondary"
                >
                  <TrendingUp className="h-4 w-4 text-warm" />
                  <span className="text-sm font-bold">
                    {hasQuery ? highlightMatch(search, query) : search}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Suggestions */}
        {filteredCategories.length > 0 && (
          <div className="p-3">
            <div className="mb-2 flex items-center gap-2 px-2">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-black uppercase text-muted-foreground">Categories</span>
            </div>
            <div className="space-y-1">
              {filteredCategories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => onSelect(category.name)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left transition-colors duration-200 hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">
                      {hasQuery ? highlightMatch(category.name, query) : category.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {hasQuery &&
          filteredTrending.length === 0 &&
          filteredCategories.length === 0 && (
            <div className="p-6 text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">No suggestions found</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Try searching for something else
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <mark className="bg-primary/20 font-black text-primary">{match}</mark>
      {after}
    </>
  );
}
