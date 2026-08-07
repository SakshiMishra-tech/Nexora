import { useEffect, useState, useCallback, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";

// 2 hours in milliseconds
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;
// 5 minutes in milliseconds
const WARNING_BEFORE_TIMEOUT_MS = 5 * 60 * 1000;
const WARNING_TRIGGER_MS = INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS;

const LAST_ACTIVITY_KEY = "nexora_last_activity";

export function SessionManager() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_BEFORE_TIMEOUT_MS);

  // If there's no auth context or the user is not logged in, we don't do anything
  const isLoggedIn = !!auth?.session?.user;

  const updateLastActivity = useCallback(() => {
    if (isLoggedIn) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      if (showWarning) {
        setShowWarning(false);
      }
    }
  }, [isLoggedIn, showWarning]);

  // Handle cross-tab synchronization for activity
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY) {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [showWarning]);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Initialize last activity if not set
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      updateLastActivity();
    }

    const events = ["mousedown", "keydown", "scroll", "mousemove", "click", "touchstart"];
    
    // Throttle the activity updates to avoid hammering localStorage
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateLastActivity();
        throttleTimer = null;
      }, 1000);
    };

    events.forEach((event) => document.addEventListener(event, handleActivity, { passive: true }));

    const checkInactivity = setInterval(() => {
      const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivityStr) return;

      const lastActivity = parseInt(lastActivityStr, 10);
      const timeSinceLastActivity = Date.now() - lastActivity;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT_MS) {
        // Logout
        auth?.signOut().then(() => {
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          setShowWarning(false);
          router.navigate({ to: "/login" });
        });
      } else if (timeSinceLastActivity >= WARNING_TRIGGER_MS) {
        // Show warning
        setShowWarning(true);
        setTimeLeft(INACTIVITY_TIMEOUT_MS - timeSinceLastActivity);
      } else {
        // All good, hide warning if shown
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach((event) => document.removeEventListener(event, handleActivity));
      clearInterval(checkInactivity);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isLoggedIn, updateLastActivity, auth, router, showWarning]);

  const handleStayLoggedIn = () => {
    updateLastActivity();
    setShowWarning(false);
  };

  const handleLogout = () => {
    auth?.signOut().then(() => {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      setShowWarning(false);
      router.navigate({ to: "/login" });
    });
  };

  const minutesLeft = Math.floor(timeLeft / 60000);
  const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Timeout Warning</DialogTitle>
          <DialogDescription>
            Your session will expire in {minutesLeft}:{secondsLeft.toString().padStart(2, '0')} due to inactivity.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          <Button onClick={handleStayLoggedIn}>
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
