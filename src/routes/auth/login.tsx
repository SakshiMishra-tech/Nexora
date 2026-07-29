import { createFileRoute } from "@tanstack/react-router";
import { AuthExperience } from "@/components/auth/AuthExperience";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Nexora - Login" },
      {
        name: "description",
        content: "Log in to Nexora with email, Google, or GitHub.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return <AuthExperience mode="sign-in" />;
}
