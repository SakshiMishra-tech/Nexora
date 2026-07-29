# API Architecture

Unlike traditional web applications with a dedicated Node.js/Django backend, Nexora utilizes a **Serverless Database API** powered by Supabase and PostgREST.

There is no traditional `/api/v1/listings` Node.js server. Instead, the PostgreSQL database *is* the API.

## PostgREST Explained
Supabase automatically inspects the PostgreSQL schema and generates a highly scalable, RESTful API.
When the React frontend uses the `@supabase/supabase-js` library, it translates JavaScript method chaining into REST HTTP requests.

### Example Mapping

| Frontend Code (Supabase JS) | Actual HTTP Request | Purpose |
|-----------------------------|---------------------|---------|
| `supabase.from('profiles').select('*')` | `GET /rest/v1/profiles?select=*` | Fetch profiles |
| `supabase.from('profiles').insert({ name: 'x' })` | `POST /rest/v1/profiles` | Create profile |
| `supabase.from('profiles').update({ name: 'x' }).eq('id', 1)` | `PATCH /rest/v1/profiles?id=eq.1` | Update profile |
| `supabase.from('profiles').delete().eq('id', 1)` | `DELETE /rest/v1/profiles?id=eq.1` | Delete profile |

## Services Layer Abstraction
To keep React components clean and prevent Supabase client logic from leaking everywhere, we encapsulate all API calls within the `src/services/` directory.

### `src/services/marketplace.service.ts`
This file acts as the repository layer for the marketplace feature.

**Key Endpoints/Methods:**
- `fetchListings()`: Fetches all visible marketplace listings. Uses `select('*')` and filters out paused/draft items unless requested by the owner.
- `fetchListingById(id)`: Fetches a single listing for the detailed view page.
- `createListing(data)`: Validates input (via Zod) and pushes a new row to `marketplace_listings`.
- `updateListing(id, data)`: Updates an existing listing.
- `deleteListing(id)`: Removes a listing (cascades to delete associated saved items and chats).

## Realtime API (WebSockets)
Supabase provides a Realtime API that listens to PostgreSQL replication slots. 
Instead of polling the database, components subscribe to changes.

```typescript
// Example: Listening to new roommate messages
const channel = supabase
  .channel('public:roommate_messages')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'roommate_messages' },
    (payload) => {
      console.log('New message received!', payload.new)
    }
  )
  .subscribe()
```
This API is crucial for our Chat functionality, allowing instant message delivery.

## Security & Validation
Because the database is exposed directly to the client via PostgREST, **Input Validation** and **Authorization** are critical.

1. **Frontend Validation:** We use **Zod** (`src/lib/marketplace-validation.ts`) to ensure data is structured correctly before being sent to the API.
2. **Backend Validation:** PostgreSQL handles strict type enforcement (e.g., trying to insert a string into a UUID column fails).
3. **Backend Authorization:** PostgREST securely parses the JWT attached to the request, identifies the user, and applies Row Level Security (RLS) policies to ensure they can only read/write authorized rows. (See `SECURITY.md` for more).
