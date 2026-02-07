# XP System Reference

## System Architecture

The XP (Experience Points) system gamifies the learning process by tracking user activities, aggregating statistics, and managing progress across different languages.

The architecture consists of:
1.  **Activity Tracking**: Immutable log of every XP-earning event.
2.  **Aggregated Stats**: High-performance tables for instant dashboard loading (Levels, Streaks).
3.  **Language Isolation**: Separate progress tracking for French and German.
4.  **Database Automation**: PostgreSQL triggers handle stats aggregation and streak calculations automatically.

## Database Schema

The system is built on three core Supabase tables defined in `database/xp_tracking_schema.sql`.

### 1. `xp_activities`
The source of truth for all user progress.
*   **Purpose**: Stores individual events.
*   **Key Fields**:
    *   `user_id`: Link to Auth user.
    *   `activity_type`: Enum ('lesson', 'practice', 'review', 'achievement').
    *   `xp_gained`: Integer amount.
    *   `language`: 'french', 'german', or 'all'.
    *   `activity_date`: Date of activity (for streaks/graphs).

### 2. `user_xp_stats`
A read-optimized summary table for the main dashboard.
*   **Purpose**: Caches user level, total XP, and streak info to avoid expensive aggregations.
*   **Key Fields**:
    *   `total_xp`: Cumulative XP.
    *   `current_level`: Calculated level (1 to ∞).
    *   `current_streak`: Consecutive days of activity.
    *   `longest_streak`: All-time record.
    *   `last_activity_date`: Used for streak calculation.
*   **Automation**: Automatically updated by `trigger_update_user_xp_stats`.

### 3. `language_progress`
Tracks detailed proficiency per language.
*   **Purpose**: Language-specific metrics.
*   **Key Fields**:
    *   `words_learned`: Vocabulary count.
    *   `vocabulary_accuracy`: Rolling accuracy average.
    *   `daily_xp_goal`: User-defined goal (default: 50).

## Database Functions & Triggers

The system uses server-side logic to ensure data integrity.

*   `update_user_xp_stats()`: Trigger function that recalculates Total XP and Level whenever an activity is inserted.
*   `update_streak_data()`: Trigger function that checks `last_activity_date` vs `new_date` to increment or reset streaks.
*   `get_xp_history(user_id, language, days)`: RPC function to efficiently fetch chart data.
*   `get_user_xp_summary(user_id)`: RPC function to fetch high-level stats.

## Application Interface (`lib/db/queries.ts`)

The application interacts with the database through these core functions:

*   **`getDailyXP(userId, period, language)`**: Fetches historical data for charts.
*   **`getStreakInfo(userId, language)`**: Retrieves current and longest streak status.
*   **`getActivityBreakdown(userId, language)`**: Returns a list of recent activities.
*   **`getLanguageSummary(userId)`**: Aggregates stats per language for the overview.
*   **`saveXPActivity(...)`** (Planned): Implementation to insert into `xp_activities`.

## XP & Leveling Logic

*   **XP Rewards**:
    *   Lesson: 50 XP
    *   Practice: 10-50 XP (based on score)
    *   Review: 25 XP
*   **Leveling Formula**: `Level = floor(sqrt(TotalXP / 100)) + 1`
*   **Streaks**: A streak increments if an activity is performed on the day immediately following the `last_activity_date`. It resets to 1 if a day is skipped.
