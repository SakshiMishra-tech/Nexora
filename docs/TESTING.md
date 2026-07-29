# Testing Strategy

Ensuring the reliability of Nexora is paramount given its real-time, user-driven nature. Our testing strategy combines automated integration tests for critical paths with rigorous manual testing guidelines.

## 1. Automated Testing (Future Implementation)
We are currently evaluating tools for our automated testing suite. The planned stack includes:
- **Unit Testing:** `Vitest` + `React Testing Library` for isolated UI components (e.g., verifying that a Button triggers its `onClick` prop).
- **End-to-End (E2E) Testing:** `Playwright` to simulate actual user flows in a headless browser.

### Planned E2E Critical Paths
When implemented, E2E tests must cover the following "Golden Paths" before any PR can be merged to `main`:
1. **Auth Flow:** A user can sign up, complete their profile, log out, and log back in.
2. **Marketplace Flow:** A user can create a listing, switch to a buyer account, search for that listing, and initiate a chat.
3. **Roommate Flow:** A user can publish a roommate profile, another user can request a connection, and the owner can accept it.

## 2. Manual Testing Checklist
Until automated E2E tests are fully integrated, developers MUST manually verify the following edge cases before submitting a Pull Request:

### Authentication & Onboarding
- [ ] Attempting to access `/marketplace` while logged out redirects to `/auth/login`.
- [ ] Logging in correctly redirects the user back to `/marketplace`.
- [ ] A new user who skips profile completion is forced to `/complete-profile`.

### Marketplace
- [ ] Image uploads succeed, and the image renders correctly in the grid.
- [ ] Empty states appear correctly when a user has no drafts/published items.
- [ ] Clicking "Save" instantly updates the UI (optimistic update), and reloading the page retains the saved state.
- [ ] Search debounce works (the API is not hit on every single keystroke).

### Real-Time Chat
- [ ] Open two browser windows with different accounts.
- [ ] Send a message from Window A.
- [ ] Window B must receive and display the message instantly without a page refresh.

## 3. Production Deployment Checklist
Before pushing major features to Vercel/Supabase production:
1. Verify all new Supabase environment variables are added to the Vercel dashboard.
2. Run `supabase db push` to ensure production database schema is identical to local/staging.
3. Verify RLS policies are strictly enabled on all newly created tables.
4. Run a Lighthouse audit on the production URL to ensure performance metrics haven't regressed.
