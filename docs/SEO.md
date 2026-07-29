# Search Engine Optimization (SEO)

Nexora is designed as a secure, walled-garden community for campus students. Therefore, our SEO strategy focuses heavily on top-of-funnel conversion (landing pages) while explicitly hiding user-generated content behind authentication walls.

## 1. Public Pages (Indexed)
The following pages are fully optimized for search engines to drive student sign-ups:
- **Homepage (`/`)**
- **Auth Pages (`/auth/login`, `/auth/signup`)**
- **Legal (`/privacy`, `/terms`)**

### Meta Tags & OpenGraph
For public pages, we inject dynamic meta tags using React Helmet or the framework's head manager.

```html
<!-- Example Head content for Homepage -->
<title>Nexora - The Ultimate Campus Network</title>
<meta name="description" content="Buy, sell, find roommates, and connect exclusively with verified students on your campus." />

<!-- OpenGraph (Facebook/LinkedIn) -->
<meta property="og:title" content="Nexora" />
<meta property="og:description" content="Connect with verified students on your campus." />
<meta property="og:image" content="https://nexora.app/og-image.png" />
<meta property="og:type" content="website" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Nexora" />
<meta name="twitter:description" content="Connect with verified students on your campus." />
<meta name="twitter:image" content="https://nexora.app/og-image.png" />
```

## 2. Protected Pages (Not Indexed)
Any content requiring authentication (Marketplace listings, Roommate profiles, Chats) MUST NOT be indexed by search engines to protect student privacy.

### Strategies Enforced:
1. **Robots.txt:** 
   Our `public/robots.txt` explicitly disallows crawling of application paths.
   ```text
   User-agent: *
   Disallow: /marketplace/
   Disallow: /roommates/
   Disallow: /dashboard/
   ```
2. **Meta Robots:** 
   Protected route layouts inject a strict no-index tag.
   ```html
   <meta name="robots" content="noindex, nofollow" />
   ```
3. **Authentication Walls:** 
   Even if a crawler bypassed the above, TanStack Router immediately intercepts unauthenticated requests and redirects them to `/auth/login` (HTTP 302/307).

## 3. Canonical URLs
To prevent duplicate content penalties, canonical URLs are enforced on all public pages, ensuring that variations (e.g., `www.nexora.app` vs `nexora.app`) resolve to a single source of truth.
