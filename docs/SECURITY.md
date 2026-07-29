# Security Posture

Nexora takes security very seriously. Because the platform relies on a Serverless Backend (Supabase PostgREST) where the client communicates directly with the database, traditional middleware security is bypassed. Therefore, our security relies entirely on database-level policies and strict frontend validation.

## 1. Authentication & Identity
Identity is established via **Supabase Auth (GoTrue)**.
- Passwords are never seen by our frontend code; they are securely hashed and stored by Supabase.
- Sessions are maintained using signed JSON Web Tokens (JWT).
- The JWT payload contains the `sub` (subject) claim, which uniquely identifies the user across the database as `auth.uid()`.

## 2. Authorization: Row Level Security (RLS)
RLS is the absolute core of Nexora's security model. It acts as an unbreakable firewall around every single row in the database.

By default, every table has RLS **enabled**. This means that if no policies are defined, all queries return `0` rows.

### Example RLS Policy (`roommate_listings`)
```sql
-- READ: Anyone can read a listing IF it is public/campus_only and not paused.
create policy "Visible roommate listings can be read"
on public.roommate_listings for select
using (
  auth.uid() = user_id -- Owner can always read their own
  or (
    is_listing_enabled = true
    and paused = false
    and visibility in ('public', 'campus_only')
  )
);

-- UPDATE: Only the exact user who created the listing can update it.
create policy "Users can update their roommate listing"
on public.roommate_listings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```
Even if a malicious user opens the console and attempts to run `supabase.from('roommate_listings').delete()`, the database evaluates `auth.uid() = user_id` for every row. It will silently succeed but affect `0` rows.

## 3. Data Integrity & Input Validation
- **Frontend Check:** React Hook Form + Zod ensures that users cannot submit invalid form shapes (e.g., negative prices, empty titles).
- **Backend Enforcements:** Postgres schema rules enforce data integrity. We use `NOT NULL` constraints, foreign keys with `ON DELETE CASCADE` to prevent orphaned data, and explicit `CHECK` constraints (e.g., `check (visibility in ('public', 'campus_only', 'hidden'))`).

## 4. Common Vulnerability Mitigation

### Cross-Site Scripting (XSS)
- React automatically escapes all string variables rendered in the DOM, neutralizing standard XSS injection attempts via user input (e.g., chat messages or listing descriptions).
- We do not use `dangerouslySetInnerHTML`.

### Cross-Site Request Forgery (CSRF)
- PostgREST APIs do not rely on implicit cookies for authorization. They require the explicit attachment of the Bearer JWT in the `Authorization` header, meaning CSRF attacks are fundamentally impossible.

### SQL Injection
- PostgREST does not construct SQL strings by concatenating input. It uses parameterized queries exclusively. It is impossible to perform an SQL injection attack against the REST API.

## 5. Secrets Management
- No secret keys (like `SERVICE_ROLE_KEY`) are ever exposed to the frontend.
- We only expose the `VITE_SUPABASE_ANON_KEY`, which is intentionally public and safe to distribute. Its *only* power is allowing the user to attempt to authenticate or query the DB as an anonymous user (which is immediately blocked by RLS).

## Production Recommendations
Before pushing Nexora to a massive production scale:
1. Ensure a strict CORS policy is configured in the Supabase dashboard to only accept requests from the official production domain.
2. Enable Rate Limiting (via Supabase Edge Functions or an external proxy like Cloudflare) to prevent brute-force or scraping attacks.
3. Review all RLS policies quarterly for potential logic gaps.
