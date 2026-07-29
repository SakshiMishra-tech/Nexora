# Nexora Product Roadmap

Nexora is evolving rapidly. This roadmap outlines our strategic goals, categorized by current focus, upcoming features, and long-term vision.

## Phase 1: Current Focus (The Core Expansion)
We are currently stabilizing and perfecting the core modules that define a student's daily life.

- **Automated Testing:** Implementing End-to-End (E2E) testing with Playwright to ensure zero regressions on critical paths.
- **Enhanced Roommate Matching Engine:** Improving the UI for swiping/filtering potential roommates based on complex preferences.
- **Marketplace Refinements:** Adding image compression before upload to Supabase Storage and implementing Infinite Scrolling for the main feed.
- **Lost & Found Module:** Finalizing the UI and integrating map-based location pinning for where items were lost/found.

## Phase 2: Upcoming (Engagement & Retention)
Features designed to keep users returning to the app multiple times a day.

- **Unified Notifications System:** A central notification bell that aggregates Chat Messages, Roommate Requests, and Marketplace Offers.
- **Campus Events Board:** A centralized calendar where student organizations can post events, sell tickets, and users can RSVP.
- **Peer-to-Peer Ridesharing:** A module for students to split Ubers/Lyfts to the airport or coordinate carpools for trips home during holidays.
- **Academic Notes Exchange:** A secure space to upload, review, and exchange class notes, gated by verified `.edu` emails.

## Phase 3: Future Vision (The Intelligent Campus)
Advanced features leveraging automation and deeper campus integration.

- **AI-Powered Moderation:** Automatically detecting and blurring inappropriate images in Marketplace and Roommate profiles using edge functions.
- **Smart Roommate Matching (AI):** Using machine learning to suggest highly compatible roommate pairs based on subtle behavioral indicators in their profiles rather than just hard filters.
- **Integrated Payments (Stripe):** Allowing students to transact directly inside the app for Marketplace goods or Event tickets, rather than relying on external apps like Venmo/CashApp.
- **Campus Safety Integrations:** Providing quick access to campus security or anonymous reporting tools directly within the app.

## Long-Term: Scaling Nexora
Currently, Nexora is scoped to a per-campus basis. The ultimate long-term goal is to build a robust multi-tenant architecture that allows us to rapidly onboard new universities with zero code changes, transforming Nexora into a global network of localized campus hubs.
