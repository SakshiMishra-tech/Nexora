import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AUTH_ROUTES } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Nexora - Authentication" }],
  }),
  component: AuthIndexRedirect,
});

function AuthIndexRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/auth") {
      void navigate({ to: AUTH_ROUTES.login, replace: true });
    }
  }, [location.pathname, navigate]);

  return <Outlet />;
}
