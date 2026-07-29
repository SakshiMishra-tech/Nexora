# Environment Variables

Nexora requires strict configuration of environment variables to function correctly across local development, staging, and production environments.

## Client-Side Variables (Vite)
Because Nexora uses Vite, any environment variable that needs to be accessed by the React frontend (running in the user's browser) **MUST** be prefixed with `VITE_`.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | **Yes** | The REST URL of the Supabase project. Required for initializing the Supabase JS client. | `https://fzhheofzidenlclfqrim.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | The public anonymous key. Safe to expose to the browser. Required to make PostgREST calls. | `eyJhbGciOiJIUzI1NiIsIn...` |

### Usage in Code
To access these variables safely with TypeScript support, we utilize Vite's `import.meta.env`:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase Environment Variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Server-Side Variables (Future/Edge)
If Nexora implements server-side APIs or Edge Functions, these variables must NOT be prefixed with `VITE_` to ensure they never leak into the client bundle.

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | No | Bypasses all Row Level Security. Only use on secure backends. |
| `STRIPE_SECRET_KEY` | No | Used for payment processing. |

## Managing Environments
- **Local:** Store variables in a `.env` file at the root of the project. This file is included in `.gitignore` and must never be committed.
- **Production:** Configure these variables directly in your hosting provider's dashboard (e.g., Vercel Environment Variables section).
