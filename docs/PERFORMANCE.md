# Performance Optimization

Nexora employs several strategies at the framework, data-fetching, and rendering levels to ensure a lightning-fast experience, crucial for a Gen-Z mobile user base.

## 1. Code Splitting & Lazy Loading
- **TanStack Router:** The file-based router automatically code-splits the JavaScript bundle by route. When a user lands on the Homepage (`/`), the browser does *not* download the JavaScript required for the Marketplace (`/marketplace`) or Roommates (`/roommates`) modules.
- **Lazy Loading Components:** Heavy components (like rich text editors or complex charts, if added) should be dynamically imported using React's `lazy()` to keep initial bundle sizes low.

## 2. Caching Strategy
- **TanStack Query:** The primary engine for performance. All Supabase data fetches are wrapped in `useQuery`.
  - **Stale-While-Revalidate:** Data is served instantly from the local cache while a background request fetches fresh data.
  - **Deduplication:** If three different components on the screen request the user's profile, React Query batches this into a single network request.
  - **Prefetching:** TanStack Router integrates with Query to prefetch data on link hover or route transition, making navigation feel instantaneous.

## 3. Image Optimization
Images uploaded to the marketplace can be quite large.
- **Supabase Storage:** Images are hosted on Supabase Storage.
- **Future Improvement:** We plan to utilize Supabase Image Transformations to request resized, compressed WebP versions of images for thumbnails (e.g., `?width=400&height=300`) rather than loading raw 4MB iPhone photos into the listing grid.

## 4. Rendering
- **Optimistic UI:** When a user takes an action (e.g., "Liking" an item), the UI updates instantly without waiting for the database response. If the network request fails, the UI rolls back to the previous state.
- **Virtualization:** For long lists (like infinite scrolling in the marketplace), we plan to implement windowing/virtualization (e.g., `@tanstack/react-virtual`) to only render DOM nodes that are currently visible on the screen.

## Lighthouse Goals
We aim for the following Lighthouse metrics on production:
- **Performance:** > 90
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100
