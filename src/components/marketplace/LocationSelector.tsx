import { MapPin, ChevronRight, Search, Loader2, Navigation, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CampusLocation, LocationSearchResult } from "@/types/marketplace-enhanced";

interface LocationSelectorProps {
  currentLocation?: CampusLocation;
  onLocationSelect: (location: CampusLocation) => void;
  onClose: () => void;
}

const mockLocations: LocationSearchResult[] = [
  { id: "1", name: "IIT Delhi", fullPath: "India > Delhi > IIT Delhi", type: "campus" },
  { id: "2", name: "IIT Bombay", fullPath: "India > Maharashtra > Mumbai > IIT Bombay", type: "campus" },
  { id: "3", name: "BITS Pilani", fullPath: "India > Rajasthan > Pilani > BITS Pilani", type: "campus" },
  { id: "4", name: "NIT Trichy", fullPath: "India > Tamil Nadu > Trichy > NIT Trichy", type: "campus" },
];

const mockHostels = [
  "Hostel 1 - Boys",
  "Hostel 2 - Boys",
  "Hostel 3 - Girls",
  "Hostel 4 - Girls",
  "Hostel 5 - PG",
];

export function LocationSelector({ currentLocation, onLocationSelect, onClose }: LocationSelectorProps) {
  const [step, setStep] = useState<"initial" | "search" | "hostel">("initial");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    // Simulate geolocation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const detectedLocation: CampusLocation = {
      id: "loc-1",
      country: "India",
      state: "Delhi",
      city: "New Delhi",
      area: "Hauz Khas",
      campus: "IIT Delhi",
      coordinates: { lat: 28.5449, lng: 77.1926 },
    };
    
    setLoading(false);
    onLocationSelect(detectedLocation);
    onClose();
  };

  const handleSearchManual = () => {
    setStep("search");
  };

  const handleCampusSelect = (campus: string) => {
    setSelectedCampus(campus);
    setStep("hostel");
  };

  const handleHostelSelect = (hostel: string) => {
    const location: CampusLocation = {
      id: `loc-${Date.now()}`,
      country: "India",
      state: "Delhi",
      city: "New Delhi",
      area: "Hauz Khas",
      campus: selectedCampus,
      hostel,
    };
    
    onLocationSelect(location);
    onClose();
  };

  const filteredLocations = mockLocations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-r from-primary/5 to-electric/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-black">Select Location</h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  {step === "initial" && "Choose your campus location"}
                  {step === "search" && "Search for your campus"}
                  {step === "hostel" && "Select your hostel"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto p-4">
          {/* Initial Step */}
          {step === "initial" && (
            <div className="space-y-3">
              {/* Use Current Location */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={loading}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-soft disabled:opacity-50"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Navigation className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black">Use Current Location</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Automatically detect your campus
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Manual Search */}
              <button
                type="button"
                onClick={handleSearchManual}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-soft"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-electric/10">
                  <Search className="h-6 w-6 text-electric" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black">Search Manually</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Find your campus or area
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Current Location Display */}
              {currentLocation && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-3">
                  <p className="mb-1 text-xs font-bold text-muted-foreground">Current Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold">
                      {currentLocation.campus}
                      {currentLocation.hostel && `, ${currentLocation.hostel}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Step */}
          {step === "search" && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campus, city, or area..."
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-semibold outline-none transition-colors focus:border-primary focus:bg-card"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <div className="space-y-2">
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleCampusSelect(location.name)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-soft"
                  >
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{location.name}</p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {location.fullPath}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </div>

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={() => setStep("initial")}
                className="w-full font-black"
              >
                Back
              </Button>
            </div>
          )}

          {/* Hostel Step */}
          {step === "hostel" && (
            <div className="space-y-3">
              <div className="mb-4 rounded-xl border border-border bg-secondary/50 p-3">
                <p className="text-xs font-bold text-muted-foreground">Selected Campus</p>
                <p className="text-sm font-black">{selectedCampus}</p>
              </div>

              <p className="text-xs font-black uppercase text-muted-foreground">Select Hostel (Optional)</p>

              <button
                type="button"
                onClick={() => handleHostelSelect("")}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-soft"
              >
                <span className="text-sm font-bold">Skip - Use Campus Only</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {mockHostels.map((hostel) => (
                <button
                  key={hostel}
                  type="button"
                  onClick={() => handleHostelSelect(hostel)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-soft"
                >
                  <span className="text-sm font-bold">{hostel}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}

              <Button
                variant="outline"
                onClick={() => setStep("search")}
                className="w-full font-black"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
