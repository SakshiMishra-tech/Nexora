# Routing & Pages

Nexora leverages **TanStack Router** to provide fully type-safe, file-based routing. Every file in the `src/routes/` directory represents a unique URL path in the application.

## Core Layout (`__root.tsx`)
The `__root.tsx` file defines the shell of the application. It contains:
- The global Navigation Bar (`Navbar`).
- The global Footer.
- Context Providers (`AuthContext`, `ThemeProvider`).
- The `<Outlet />` component, where child route components are injected.

---

## Route Breakdown

### 1. Public Routes

#### `/` (`index.tsx`)
- **Purpose:** The main landing page.
- **Content:** Hero section introducing Nexora, value propositions, and calls to action (Sign Up / Log In).
- **SEO:** Optimized with meta tags describing Nexora as the ultimate campus networking platform.

#### `/auth/login` & `/auth/signup`
- **Purpose:** Authentication portals.
- **Forms:** Utilizes React Hook Form and Zod to validate email and password inputs before calling Supabase GoTrue methods.
- **Navigation:** Upon success, users are redirected back to their intended destination (via `?redirect=` search param) or to `/`.

#### `/privacy` & `/terms`
- **Purpose:** Static legal pages required for compliance.

---

### 2. Protected Routes (Require Session)

#### `/marketplace` (`marketplace.tsx`)
- **Purpose:** The core trading hub for students.
- **Components Used:** `MarketplaceHeader`, `SellerDashboard`, `ListingDetail`.
- **Data Loading:** Employs TanStack Query to pre-fetch marketplace listings based on the user's campus.
- **State:** Uses URL Search Params (managed by TanStack Router) to handle active tabs, categories, and search queries, ensuring the page is highly shareable.

#### `/roommates` (`roommates.tsx`)
- **Purpose:** The roommate matching module.
- **Forms:** Contains the multi-step `RoommateProfileForm` for capturing lifestyle preferences.
- **Navigation:** Includes tabs for "Find Roommates", "My Profile", and "Requests".

#### `/lost-found` (`lost-found.tsx`)
- **Purpose:** A feed of lost and found items.
- **Components Used:** Standardized feed cards.

#### `/events`, `/dating`, `/rides`, `/notes`
- **Purpose:** Specialized modules for campus life.
- *Note: Some of these are currently in development as indicated by the Roadmap.*

---

### 3. Onboarding Routes

#### `/complete-profile` (`complete-profile.tsx`)
- **Purpose:** Forced routing step for users who have signed up but haven't provided mandatory information (e.g., Full Name, College Name).
- **Validation:** Controlled by the `isProfileComplete()` utility in `auth.ts`. If false, the router redirects users here immediately after login.

---

## Data Loading & SEO

TanStack Router allows us to define `loader` functions directly in the route definition.

```typescript
// Example Route Definition
export const Route = createFileRoute('/marketplace')({
  beforeLoad: async ({ context }) => {
    // 1. Check Auth (Route Guard)
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/login', search: { redirect: '/marketplace' } })
    }
  },
  loader: async ({ queryClient }) => {
    // 2. Pre-fetch Data
    return queryClient.ensureQueryData({
      queryKey: ['marketplace_listings'],
      queryFn: fetchListings
    })
  }
})
```

### SEO Meta Tags
While Nexora is primarily a highly-interactive web application (SPA), we ensure basic SEO compliance for public routes by injecting `<title>` and `<meta name="description">` tags within the route components using React Helmet or native document modification, ensuring proper OpenGraph links when shared on social media.
