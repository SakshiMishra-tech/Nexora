# Technical Decisions

This document outlines the core architectural and tooling choices made for the Nexora project, explaining the *why* behind the *what*. We aim to build a platform that is extremely fast, highly secure, and easily maintainable by a small team of engineers.

---

## 1. Why React?
**Decision:** We chose React (specifically React 19) as our core frontend library.

**Rationale:**
- **Ecosystem:** React has the most mature ecosystem of libraries (like Radix UI, Framer Motion) which drastically reduces development time for complex UIs.
- **Talent Pool:** As a campus networking app with potential open-source or student contributions, React is the most widely taught and understood framework among modern developers.
- **Component Reusability:** The UI for Nexora involves many recurring patterns (Listing Cards, Stat Boxes, Avatars). React's component model perfectly aligns with this.

---

## 2. Why TanStack Start & Router?
**Decision:** Instead of Next.js or traditional React Router, we opted for the `@tanstack` ecosystem (TanStack Start + Router).

**Rationale:**
- **Absolute Type Safety:** TanStack Router provides 100% type safety across route definitions, URL parameters, search params, and navigation. This eliminates a massive category of runtime errors (e.g., navigating to `/marketplace/123` but forgetting to pass a required query parameter).
- **Data Loading:** It handles data pre-fetching at the route level beautifully, eliminating UI "waterfalls" where components load incrementally.
- **No Vercel Lock-in:** While Next.js heavily incentivizes hosting on Vercel to use all its features, TanStack Start is platform-agnostic, giving us the flexibility to deploy on Cloudflare, Netlify, or standard Node.js servers without missing features.

---

## 3. Why Supabase?
**Decision:** We use Supabase as our Backend-as-a-Service (BaaS) and primary database.

**Rationale:**
- **PostgreSQL at the Core:** Unlike Firebase (NoSQL), Supabase gives us raw PostgreSQL. A campus networking app has heavily relational data (Users -> Listings -> Messages -> Saves). Postgres handles this beautifully.
- **Row Level Security (RLS):** Security is pushed down to the database layer. Even if the frontend is compromised or malicious requests are sent to the API, the database itself rejects unauthorized queries.
- **Realtime out-of-the-box:** Features like the Marketplace Chat require WebSockets. Building and scaling a custom WebSocket server is complex; Supabase Realtime handles this automatically by subscribing to Postgres row changes.
- **Velocity:** It eliminates the need to build a CRUD Node.js/Express API, saving hundreds of hours of backend boilerplate.

---

## 4. Why Vite?
**Decision:** We use Vite as our build tool and development server.

**Rationale:**
- **Speed:** Vite uses native ES modules during development, meaning server startup is nearly instantaneous, and Hot Module Replacement (HMR) takes milliseconds regardless of app size.
- **Simplicity:** It requires significantly less configuration than Webpack.

---

## 5. Why TypeScript?
**Decision:** The entire codebase is strictly typed using TypeScript.

**Rationale:**
- **Maintainability:** As the schema for a `MarketplaceListing` or `RoommateProfile` changes, TypeScript immediately flags every component that needs updating.
- **Self-Documenting Code:** Types serve as the best form of inline documentation, making it significantly easier for new developers to understand what data a component expects.

---

## 6. Why Tailwind CSS v4 & shadcn/ui?
**Decision:** We use Tailwind CSS v4 for styling and shadcn/ui for our component library.

**Rationale:**
- **Tailwind v4:** Upgrading to v4 removed the clunky `tailwind.config.js` in favor of native CSS variables. It is faster to compile and easier to read.
- **shadcn/ui over Material/Chakra:** shadcn/ui is *not* an npm package. It provides raw code that we own and can modify completely. This allows us to maintain Nexora's unique "premium" brand identity without fighting against a library's default styles or specificity issues.

---

## 7. Current Architecture Constraints
While these decisions enable rapid development, we acknowledge certain tradeoffs:
- **Business Logic in the Client:** Because we use Supabase, much of the orchestration logic (e.g., "if listing is saved, increment a counter") happens in the frontend or via Postgres triggers, rather than in a traditional backend controller.
- **Heavy Client:** Relying on a thick React client means our JavaScript bundle is relatively large. We mitigate this via route-based code splitting provided by TanStack Router.
