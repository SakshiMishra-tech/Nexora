# Developer Guide

Welcome to the Nexora engineering team! This guide is designed to get you productive in the codebase as quickly as possible.

## 1. Learning Path
If you are new to this tech stack, do not try to understand the entire application at once. Follow this learning sequence:

1. **Vite & React 19:** Understand the basic build tool and React's new hooks (though we rely heavily on TanStack Query).
2. **Tailwind v4:** Familiarize yourself with utility classes. We do not write custom CSS.
3. **shadcn/ui:** Read the docs for Shadcn to understand how our `src/components/ui` folder works.
4. **TanStack Router:** This is crucial. Read the official documentation to understand file-based routing and route loaders.
5. **Supabase (PostgREST & RLS):** Understand how we query the database from the client and how Row Level Security keeps it safe.

## 2. Recommended Reading Order
To understand how Nexora is stitched together, read the files in this order:

1. `package.json`: Look at the scripts and dependencies.
2. `src/routes/__root.tsx`: See how the global layout and context providers are wrapped.
3. `src/lib/supabase.ts`: See how the database client is initialized.
4. `src/routes/marketplace.tsx`: A great example of a complete feature. Observe how it uses `loader` to fetch data before rendering.
5. `src/components/marketplace/SellerDashboard.tsx`: See how complex UIs are composed using our UI primitives.
6. `supabase/schema.sql`: Understand the core data structures and RLS policies.

## 3. Best Practices
- **Component Isolation:** If a component is getting larger than 300 lines, it probably needs to be broken down.
- **Data Fetching:** NEVER use `useEffect` for data fetching. Always use TanStack React Query (`useQuery`, `useMutation`).
- **Styling:** Use the `cn()` utility (found in `src/lib/utils.ts`) to merge Tailwind classes, especially when passing `className` as a prop.
- **Type Safety:** Do not use `any`. Always define interfaces or rely on the generated Supabase types.

## 4. Common Mistakes
- **Forgetting RLS:** Creating a new table in Supabase but forgetting to write an RLS policy. *Result: The frontend gets a 401 Unauthorized or 0 rows returned.*
- **Direct Supabase Calls in UI:** Writing `supabase.from('x')` directly inside a React component's `onClick`. *Fix: Move this to a service file (`src/services/`) and wrap it in a React Query `useMutation`.*
- **Unoptimized Images:** Uploading massive raw images to Supabase Storage. Always strive to compress or use transformations.
