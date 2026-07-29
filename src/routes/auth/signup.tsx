import { createFileRoute } from "@tanstack/react-router";
import { AuthExperience } from "@/components/auth/AuthExperience";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Nexora - Create Account" },
      {
        name: "description",
        content: "Create a Nexora account with email, Google, or GitHub.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return <AuthExperience mode="sign-up" />;
}
