# Folder Structure

Nexora follows a highly organized, feature-driven folder structure dictated primarily by Vite and TanStack Router. This ensures that the codebase remains navigable even as the application scales.

## Overview

```text
nexora/
├── public/                 # Static assets (images, icons, robots.txt, etc.)
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── marketplace/    # Feature-specific components
│   │   └── ui/             # Reusable UI primitives (shadcn)
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   ├── routes/             # TanStack file-based routing
│   ├── services/           # API and Supabase abstraction layers
│   └── types/              # TypeScript definitions
├── supabase/               # Supabase migrations, schemas, and seeds
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundler configuration
```

---

## Deep Dive: `src/` Directory

### `src/components/`
This directory holds all visual building blocks of the application.
- **`ui/`**: Contains generic, highly reusable UI components (Buttons, Inputs, Dialogs) generated via `shadcn/ui`. These components are decoupled from business logic and rely on Radix UI primitives for accessibility.
- **`marketplace/`**: Contains components specifically built for the marketplace feature. 
  - *Example:* `SellerDashboard.tsx`, `ListingDetail.tsx`, `MarketplaceHeader.tsx`.
  - *Why:* Grouping by feature rather than by type (e.g., separating "Headers" from "Cards") makes it easier to delete or refactor an entire feature at once.

### `src/contexts/`
Contains global React context providers.
- **`AuthContext.tsx`**: Wraps the application to provide the current authenticated user's session globally. It subscribes to Supabase Auth state changes (`onAuthStateChange`) and avoids prop-drilling user data down the component tree.

### `src/hooks/`
Contains custom React hooks for localized state management or side-effects.
- **`useAuth.ts`**: A convenience wrapper around `AuthContext`.
- **`useMarketplace.ts`**: Encapsulates TanStack Query hooks for fetching, creating, and updating marketplace listings. Keeps component files clean of complex data-fetching logic.

### `src/lib/`
Contains pure utility functions, constants, and third-party initializations.
- **`supabase.ts`**: Initializes and exports the singleton Supabase client using environment variables.
- **`utils.ts`**: Contains generic helpers, notably `cn()` which merges Tailwind classes dynamically using `clsx` and `tailwind-merge`.
- **`marketplace-validation.ts`**: Contains Zod schemas defining the shape and validation rules for marketplace forms, ensuring frontend and backend validation stay in sync.

### `src/routes/`
The core of the application's navigation. Nexora uses TanStack Router, which implements a file-based routing convention.
- **`__root.tsx`**: The root layout that wraps the entire application (usually contains the main navigation bar and footer).
- **`index.tsx`**: Maps to the root URL `/`.
- **`marketplace.tsx`**: Maps to `/marketplace`.
- **`api/`**: Although primarily a frontend app, TanStack Start supports backend API routes. If implemented, server-side functions reside here.

### `src/services/`
Contains functions that interact directly with external APIs or the database.
- **`marketplace.service.ts`**: Abstracts away the direct `@supabase/supabase-js` calls. Functions like `fetchListings()` or `deleteListing(id)` live here. 
- *Why:* If we ever migrate away from Supabase to a custom REST API, we only need to rewrite these service files, not the React components themselves.

### `src/types/`
Contains global TypeScript interfaces and types.
- **`marketplace.ts`**: Defines the `MarketplaceListing` interface, ensuring type safety when rendering listings or submitting forms.

---

## Deep Dive: `supabase/` Directory
This directory manages the database schema using Supabase CLI conventions.

- **`schema.sql`**: The master file representing the current state of the PostgreSQL database, including table definitions and Row Level Security (RLS) policies.
- **`migrations/`**: Contains timestamped SQL files (e.g., `20260726000000_marketplace_rls.sql`). These track incremental changes to the database structure and are executed automatically during deployment.
- **`seed_marketplace.sql`**: Contains mock data used to populate the local development database for testing purposes.
