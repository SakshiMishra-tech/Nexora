# Contributing to Nexora

We love your input! We want to make contributing to Nexora as easy and transparent as possible, whether it's:
- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies:** `npm install`
3. **If you've added code that should be tested, add tests.** (Testing framework pending).
4. **Ensure the test suite passes:** `npm run lint` and `npx tsc --noEmit`.
5. **Format your code:** `npm run format`.
6. **Issue that pull request!**

## Branch Naming Convention
Please follow this convention when creating branches:
- `feat/feature-name` (e.g., `feat/roommate-chat`)
- `fix/bug-description` (e.g., `fix/header-alignment`)
- `docs/documentation-update` (e.g., `docs/api-readme`)
- `chore/maintenance-task` (e.g., `chore/update-deps`)

## Commit Messages
We adhere to [Conventional Commits](https://www.conventionalcommits.org/).
Example:
- `feat(marketplace): add image carousel to listing detail`
- `fix(auth): resolve infinite redirect loop on onboarding`
- `style(ui): update primary button hover state`

## Coding Standards
- **TypeScript:** Use interfaces for component props and Supabase row definitions. Avoid `any`.
- **Components:** Prefer functional components with hooks. Do not use class components.
- **Styling:** Use Tailwind utility classes via the `cn()` helper. Do not write custom `.css` files unless absolutely necessary (e.g., global resets).
- **State:** Prefer React Query for server state. Use `useState` for local ephemeral UI state (like a dropdown toggle). Avoid complex Redux-like global stores.

## Pull Request Process
1. Update the `README.md` or relevant files in `docs/` with details of changes to the interface.
2. The PR must be approved by at least one core maintainer before merging.
3. Vercel will automatically generate a Preview Deployment. Ensure you verify the UI changes on this preview URL.
