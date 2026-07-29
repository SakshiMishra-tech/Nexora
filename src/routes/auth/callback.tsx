import { createFileRoute } from "@tanstack/react-router";
import { AuthStatusScreen } from "@/components/auth/ProtectedRoute";
import { useProfileRedirect } from "@/hooks/useProfileRedirect";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Nexora - Completing sign in" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  useProfileRedirect();

  return <AuthStatusScreen title="Completing sign in" />;
}
