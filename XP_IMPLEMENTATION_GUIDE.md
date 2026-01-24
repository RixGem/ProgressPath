# XP Tracking Implementation Guide

## Quick Start: Making XP Charts Display Real Data

This guide shows you how to connect the existing XP chart components to real Supabase data.

## Prerequisites

✅ You already have:
- XP chart components (`XPChart.tsx`, `XPStatsCard.tsx`)
- Dashboard pages with charts rendered
- API endpoints (`/api/dashboard/xp`, etc.)
- `useDashboardData` hook properly configured
- Navigation to dashboard pages

❌ What's missing:
- Database tables to store XP data
- Real queries instead of mock data

## Step 1: Set Up Database Schema

### 1.1 Run the Schema in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `database/xp_tracking_schema.sql`
5. Click **Run** to execute

This creates:
- `xp_activities` - Individual XP events
- `user_xp_stats` - Aggregated statistics
- `language_progress` - Language-specific progress
- Automatic triggers for stat updates
- Helper functions for queries

### 1.2 Verify Tables Created

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('xp_activities', 'user_xp_stats', 'language_progress');
```

You should see all three tables listed.

## Step 2: Update Database Queries

Replace the mock functions in `lib/db/queries.ts` with real Supabase queries.

### 2.1 Update `fetchXPData()`

**Replace this:**
```typescript
// Current mock implementation
const data = getDataForPeriod(period);
```

**With this:**
```typescript
import { supabase } from '@/lib/supabase';

export async function fetchXPData(
  userId: string,
  period: TimePeriod = 'weekly',
  language?: Language
): Promise<ChartDataPoint[]> {
  try {
    const startDate = getStartDateForPeriod(period);
    
    let query = supabase
      .from('xp_activities')
      .select('activity_date, xp_gained')
      .eq('user_id', userId)
      .gte('activity_date', startDate.toISOString().split('T')[0])
      .order('activity_date', { ascending: true });
    
    if (language && language !== 'all') {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group by date and sum XP
    const groupedData = new Map<string, number>();
    data?.forEach(row => {
      const date = row.activity_date;
      const currentXP = groupedData.get(date) || 0;
      groupedData.set(date, currentXP + row.xp_gained);
    });
    
    // Convert to ChartDataPoint format
    return Array.from(groupedData.entries()).map(([date, xp]) => ({
      date,
      xp,
      label: formatDateForPeriod(new Date(date), period),
      timestamp: new Date(date).getTime()
    }));
  } catch (error) {
    console.error('Error fetching XP data:', error);
    throw new Error('Failed to fetch XP data');
  }
}
```

### 2.2 Update `fetchDashboardData()`

**Replace mock data with:**
```typescript
export async function fetchDashboardData(
  userId: string,
  language?: Language
): Promise<DashboardData> {
  try {
    // Fetch XP stats
    let statsQuery = supabase
      .from('user_xp_stats')
      .select('*')
      .eq('user_id', userId);
    
    if (language && language !== 'all') {
      statsQuery = statsQuery.eq('language', language);
    }
    
    const { data: statsData, error: statsError } = await statsQuery.single();
    
    if (statsError) throw statsError;
    
    const xpStats: XPStats = {
      totalXP: statsData.total_xp,
      currentLevelXP: statsData.current_level_xp,
      nextLevelXP: statsData.next_level_xp,
      level: statsData.current_level,
      progress: ((statsData.total_xp - statsData.current_level_xp) / 
                 (statsData.next_level_xp - statsData.current_level_xp)) * 100
    };
    
    // Fetch chart data
    const chartData = await fetchXPData(userId, 'weekly', language);
    
    // Fetch recent activities
    const recentActivities = await fetchRecentActivities(userId, 10, language);
    
    // Fetch time and streak data
    const timeStats = {
      totalMinutes: statsData.total_minutes || 0,
      todayMinutes: 0, // Calculate from today's activities
      weekMinutes: 0, // Calculate from this week
      monthMinutes: 0, // Calculate from this month
      averageDaily: Math.floor(statsData.total_minutes / 30) || 0
    };
    
    const streakData: StreakData = {
      currentStreak: statsData.current_streak || 0,
      longestStreak: statsData.longest_streak || 0,
      streakGoal: 30,
      isActive: statsData.current_streak > 0,
      lastActivityDate: new Date(statsData.last_activity_date)
    };
    
    return {
      xpStats,
      chartData,
      recentActivities,
      timeStats,
      streakData,
      language
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}
```

### 2.3 Update `fetchRecentActivities()`

**Replace with:**
```typescript
export async function fetchRecentActivities(
  userId: string,
  limit: number = 10,
  language?: Language
): Promise<Activity[]> {
  try {
    let query = supabase
      .from('xp_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (language && language !== 'all') {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(row => ({
      id: row.id,
      type: row.activity_type as Activity['type'],
      title: row.title,
      description: row.description,
      xpGained: row.xp_gained,
      timestamp: new Date(row.created_at),
      language: row.language
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw new Error('Failed to fetch activities');
  }
}
```

### 2.4 Update `saveXPActivity()`

**Replace with:**
```typescript
export async function saveXPActivity(
  userId: string,
  xp: number,
  activityType: string,
  description?: string,
  language?: Language
): Promise<Activity> {
  try {
    const activityData = {
      user_id: userId,
      activity_type: activityType,
      xp_gained: xp,
      language: language || 'all',
      title: `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} completed`,
      description,
      activity_date: new Date().toISOString().split('T')[0]
    };
    
    const { data, error } = await supabase
      .from('xp_activities')
      .insert(activityData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      type: data.activity_type as Activity['type'],
      title: data.title,
      description: data.description,
      xpGained: data.xp_gained,
      timestamp: new Date(data.created_at),
      language: data.language
    };
  } catch (error) {
    console.error('Error saving XP activity:', error);
    throw new Error('Failed to save XP activity');
  }
}
```

## Step 3: Initialize User Stats

When a user first signs up or starts using the XP system, initialize their stats:

### Create initialization function in `lib/db/queries.ts`:

```typescript
export async function initializeUserXPStats(userId: string): Promise<void> {
  try {
    // Initialize for all languages
    const languages: Language[] = ['french', 'german', 'all'];
    
    for (const language of languages) {
      await supabase
        .from('user_xp_stats')
        .insert({
          user_id: userId,
          language,
          total_xp: 0,
          current_level: 1,
          current_level_xp: 0,
          next_level_xp: 100
        })
        .onConflict('user_id, language')
        .ignore();
      
      if (language !== 'all') {
        await supabase
          .from('language_progress')
          .insert({
            user_id: userId,
            language
          })
          .onConflict('user_id, language')
          .ignore();
      }
    }
  } catch (error) {
    console.error('Error initializing user XP stats:', error);
  }
}
```

### Call it after user signup/login:

```typescript
// In your auth callback or user creation flow
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  await initializeUserXPStats(user.id);
}
```

## Step 4: Award XP for Activities

Add XP recording to your learning activities.

### Example: French Lesson Completion

```typescript
// In your French lesson component
async function handleLessonComplete() {
  const user = await supabase.auth.getUser();
  
  if (user.data.user) {
    await saveXPActivity(
      user.data.user.id,
      50, // XP amount
      'lesson',
      'Completed French Grammar Lesson',
      'french'
    );
    
    // The triggers will automatically update user_xp_stats
    // and the charts will show the new data
  }
}
```

### Example: German Practice Session

```typescript
async function handlePracticeComplete(score: number) {
  const user = await supabase.auth.getUser();
  const xpAmount = Math.floor(score * 10); // 10 XP per point
  
  if (user.data.user) {
    await saveXPActivity(
      user.data.user.id,
      xpAmount,
      'practice',
      `Practice session: ${score}/10`,
      'german'
    );
  }
}
```

## Step 5: Test the System

### 5.1 Add Test Data

Use the SQL Editor to add sample activities:

```sql
-- Insert test activities for your user
INSERT INTO xp_activities (user_id, activity_type, xp_gained, language, title, description, activity_date)
VALUES 
  (auth.uid(), 'lesson', 50, 'french', 'French Grammar', 'Completed lesson on verb conjugation', CURRENT_DATE),
  (auth.uid(), 'practice', 30, 'french', 'Vocabulary Practice', 'Practiced 20 words', CURRENT_DATE - 1),
  (auth.uid(), 'lesson', 50, 'german', 'German Basics', 'Introduction to German', CURRENT_DATE - 2),
  (auth.uid(), 'review', 25, 'french', 'Weekly Review', 'Review session', CURRENT_DATE - 3);
```

### 5.2 Verify Data Flows

1. Navigate to `/dashboard`
2. Check if XP stats show real numbers
3. Verify charts display actual data points
4. Check `/dashboard/french` for French-specific data
5. Check `/dashboard/german` for German-specific data

### 5.3 Test Real-Time Updates

1. Complete a lesson or practice
2. Refresh the dashboard
3. Verify new XP appears in:
   - Total XP count
   - Recent activities list
   - Chart data points

## Step 6: Remove Mock Data Fallbacks

Once real data is working, clean up the mock data:

### In `components/XPChart.tsx`:

**Remove these lines (around line 107-110):**
```typescript
// For now, use mock data
await new Promise(resolve => setTimeout(resolve, 500));
const mockData = getDataForPeriod(config.period);
setRawData(mockData);
```

**Replace with:**
```typescript
// Fetch real data from API
const response = await fetch(`/api/dashboard/xp?period=${config.period}&userId=${userId}`);
const { success, data } = await response.json();

if (success) {
  setRawData(data.data); // data.data contains ChartDataPoint[]
} else {
  throw new Error('Failed to load chart data');
}
```

## Troubleshooting

### Charts Still Show Mock Data

**Check:**
1. Database schema ran successfully
2. User has initialized stats (run `initializeUserXPStats()`)
3. API endpoints are using updated queries (check `lib/db/queries.ts`)
4. Browser cache cleared

### No Data Showing

**Check:**
1. User has XP activities in database
2. User ID matches between frontend and database
3. RLS policies allow user to read their data
4. Console for errors

### Database Errors

**Common issues:**
- Missing RLS policies: Run schema again
- User not authenticated: Check auth session
- Foreign key violations: Ensure user exists in `auth.users`

## XP Reward Guidelines

Recommended XP amounts for consistency:

| Activity | XP Reward | Notes |
|----------|-----------|-------|
| Complete Lesson | 50 | Standard lesson completion |
| Practice Session | 10-50 | Based on accuracy/score |
| Daily Review | 25 | Reviewing learned material |
| Achievement | 100+ | Milestone achievements |
| Streak Bonus | 10-30 | Maintaining daily streaks |
| Perfect Quiz | 75 | 100% score on quiz |

## Next Steps

After real data is flowing:
1. Add more activity types (flashcards, speaking practice, etc.)
2. Implement achievements and badges
3. Add leaderboards
4. Create XP multipliers for streaks
5. Add level-up notifications
6. Create weekly/monthly challenges

## Summary

✅ **You now have:**
- Database schema for XP tracking
- Real queries replacing mock data
- Activity recording system
- Automatic stat updates
- Working XP charts with real progress

🎉 **Your XP charts now display actual user progress!**
