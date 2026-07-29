# Changelog

All notable changes to the Nexora project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Automated End-to-End Testing pipeline using Playwright.
- AI-based image moderation for Marketplace uploads.

## [v1.0.0] - 2026-07-29
### Added
- **Complete Documentation Overhaul:** Generated 20 professional-grade Markdown files covering Architecture, Database, Authentication, and Developer Guides.
- **Marketplace Seller Dashboard Redesign:** Completely rebuilt the `SellerDashboard.tsx` to feature a top-down premium layout, horizontal tabs, integrated analytics, and illustration-style empty states.
- **Roommate Matching Engine:** Launched the core matching algorithm with detailed preference filters and visit scheduling.
- **Real-Time Chat:** Integrated Supabase Realtime for instant messaging across Marketplace and Roommate modules.

## [v0.2.0] - 2026-06-15
### Added
- **Auth Flow Integration:** Connected frontend to Supabase GoTrue. Added mandatory profile completion (`/complete-profile`).
- **TanStack Router Migration:** Moved from traditional React Router to TanStack Router for full type safety.
- **UI System:** Integrated Tailwind v4 and Shadcn UI primitives.

## [v0.1.0] - 2026-05-01
### Added
- Initial project scaffolding using Vite and React.
- Basic Supabase schema definitions and RLS policies for `profiles`.
