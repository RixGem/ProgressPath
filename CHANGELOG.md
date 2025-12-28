# Changelog

All notable changes to the ProgressPath project will be documented in this file.

## [Unreleased]

## [2025-12-27] - Security Fixes
### Fixed
- **Critical**: Removed fallback to `NEXT_PUBLIC_JWT_SECRET` in `middleware.js` to prevent client-side secret exposure.
- **Robustness**: Added error handling for Supabase client initialization in `lib/supabase.js`.
- **Security**: Implemented comprehensive input validation for all database operations in `lib/userSync.js` (UUID validation, email format, string sanitization).

## [2025-12-26] - Embed Token API
### Added
- **API**: New endpoints for generating JWT embed tokens (`POST/GET /api/auth/generate-embed-token`).
- **Feature**: Tokens are read-only, configurable (duration), and include user info.
- **Documentation**: Added `EMBED_TOKEN_API_GUIDE.md` and `EMBED_TOKEN_QUICKSTART.md`.

## [2025-12-24] - Daily Quotes & Vocabulary Fixes
### Improved
- **Daily Quotes Cron**:
    - Implemented exponential backoff retry mechanism (3 retries).
    - Added batch processing (6 batches of 5 quotes) to reduce memory usage.
    - Added environment variable validation at startup.
    - Migrated `DailyQuote` component from Zen Quotes API to Supabase `daily_quotes` table for better reliability and performance.
- **Frontend**:
    - Fixed vocabulary display inconsistency on French Learning page.
    - Added helper functions to normalize vocabulary data formats (handling legacy string vs new array formats).
    - Added legacy data notice for older records.

### Fixed
- **Database**: Corrected schema inconsistencies in `daily_quotes` table (`day_id` vs `created_date`).

## [2025-12-23] - French Learning & User Sync
### Added
- **French Learning Page**:
    - **Vocabulary Tracking**: Added `new_vocabulary` array field and UI badges.
    - **Practice Sentences**: Added `practice_sentences` array field and list display.
    - **Mood Tracking**: Added `mood` field (good/neutral/difficult) with emoji indicators.
    - **Streak Calculation**: Implemented real-time daily streak logic.
    - **Stats**: Enhanced dashboard with vocabulary counters and improved 7-day calendar.
- **User Synchronization**:
    - **AuthContext**: Enhanced with automatic session refresh, cross-tab sync, and race condition fixes.
    - **Hooks**: Added `useUserProfile` hook for easy profile management.
    - **Utilities**: Added robust sync utilities with retry logic (`lib/userSync.js`).

### Fixed
- **French Learning**:
    - Fixed "Total Hours" calculation to use `total_time` field (minutes ÷ 60).
    - Added backward compatibility for existing `duration_minutes` data.
- **Auth**:
    - Fixed race conditions in authentication state management.
    - Fixed stale sessions causing unexpected logouts.

## [2025-12-23] - Dark Mode & Initial Features
### Added
- **Dark Mode**:
    - Complete theme switching functionality (Light/Dark).
    - `ThemeToggle` component with localStorage persistence.
    - Comprehensive styling updates across Home, Books, and French pages.
- **Daily Quotes**:
    - Initial implementation of rotating inspirational quotes on homepage.
