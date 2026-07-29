import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AUTH_ROUTES } from "@/lib/auth";

export const Route = createFileRoute("/onboarding/campus-spaces")({
  head: () => ({ meta: [{ title: "Nexora - Choose Your Campus Spaces" }] }),
  component: CampusSpacesOnboardingRoute,
});

function CampusSpacesOnboardingRoute() {
  return (
    <ProtectedRoute>
      <CampusSpacesOnboarding />
    </ProtectedRoute>
  );
}

function CampusSpacesOnboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: AUTH_ROUTES.campusSpaces, replace: true });
  }, [navigate]);

  return null;
}
