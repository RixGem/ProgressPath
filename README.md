# ProgressPath - Learning Tracker

A modern Next.js application to track your learning progress across books and languages with comprehensive analytics and streak tracking.

## Features

### 📚 Books Dashboard
- Add and manage your book collection
- Track reading progress with visual progress bars
- Categorize books by status (To Read, Reading, Completed)
- Edit and update book information
- Monitor reading statistics

### 🇫🇷 French Learning Dashboard
- **Activity Tracking**: Log daily learning activities with detailed information
- **Multiple Activity Types**: vocabulary, grammar, reading, listening, speaking, writing, exercises
- **Vocabulary Tracking**: Record new words learned with each session
- **Sentence Practice**: Log practice sentences you worked on
- **Mood Indicators**: Track how each session went (good 😊, neutral 😐, difficult 😓)
- **Streak Tracking**: Automatic calculation of consecutive learning days
- **Time Management**: Automatic total hours calculation (proper minute-to-hour conversion)
- **Visual Analytics**: 
  - Total Hours studied
  - Current learning streak with flame icon
  - Total sessions completed
  - Total vocabulary words learned
  - 7-day activity calendar showing daily minutes
- **Comprehensive Activity Log**: View all past activities with vocabulary badges and sentence lists
- **Session Notes**: Add detailed notes for each learning session

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

Make sure you have Node.js 18+ installed.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RixGem/ProgressPath.git
cd ProgressPath
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase tables:

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  total_pages INTEGER NOT NULL,
  current_page INTEGER DEFAULT 0,
  status TEXT DEFAULT 'reading',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create french_learning table with all enhanced fields
CREATE TABLE french_learning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_time INTEGER NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  new_vocabulary TEXT[],
  practice_sentences TEXT[],
  mood TEXT DEFAULT 'neutral' CHECK (mood IN ('good', 'neutral', 'difficult')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE french_learning ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Enable all operations for books" ON books
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for french_learning" ON french_learning
  FOR ALL USING (true);
```

### Database Schema Details

#### french_learning Table Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier (auto-generated) |
| `activity_type` | TEXT | Yes | Type of activity (vocabulary, grammar, reading, listening, speaking, writing, exercise) |
| `duration_minutes` | INTEGER | Yes | Session duration in minutes (backward compatibility) |
| `total_time` | INTEGER | Yes | Total time in minutes (primary field for calculations) |
| `notes` | TEXT | No | Optional notes about the session |
| `date` | DATE | Yes | Date of the activity |
| `new_vocabulary` | TEXT[] | No | Array of new vocabulary words learned |
| `practice_sentences` | TEXT[] | No | Array of practice sentences |
| `mood` | TEXT | No | Session difficulty/feeling (good/neutral/difficult) |
| `created_at` | TIMESTAMP | Yes | Record creation timestamp (auto-generated) |

**Important Notes**:
- `total_time` is the primary field used for Total Hours calculation and automation
- `new_vocabulary` and `practice_sentences` are stored as PostgreSQL arrays
- `mood` has a CHECK constraint to ensure valid values
- Array fields accept NULL values when no data is provided

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Migration

If you have an existing `french_learning` table, you'll need to migrate it to add the new fields:

### For total_time field:
See `DATABASE_MIGRATION.md` for detailed instructions.

### For new enhanced fields:
See `DATABASE_MIGRATION_NEW_FIELDS.md` for:
- `new_vocabulary` array field
- `practice_sentences` array field
- `mood` field

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy!

## Usage

### Books Dashboard
1. Click "Add Book" to add a new book to your collection
2. Fill in the book details (title, author, total pages, current page)
3. Update your reading progress anytime by editing the book
4. Track your overall reading statistics

### French Learning Dashboard

#### Logging an Activity
1. Click "Log Activity" to open the form
2. Select your activity type (vocabulary, grammar, etc.)
3. Enter duration in minutes
4. Choose the date (defaults to today)
5. Select how the session went (mood):
   - 😊 Good - Felt confident
   - 😐 Neutral - Okay progress
   - 😓 Difficult - Challenging
6. **Optional**: Add new vocabulary words (comma-separated)
   - Example: `bonjour, merci, au revoir`
7. **Optional**: Add practice sentences (comma-separated)
   - Example: `Comment allez-vous?, Je vais bien`
8. **Optional**: Add notes about what you learned
9. Click "Log Activity" to save

#### Viewing Your Progress
- **Total Hours**: See your cumulative learning time (properly converted from minutes)
- **Current Streak**: Track consecutive days of learning with flame icon 🔥
- **Total Sessions**: Count of all learning activities
- **Vocabulary Words**: Total number of unique words learned
- **7-Day Activity**: Visual calendar showing daily learning minutes
- **Recent Activities**: Detailed list showing:
  - Activity type and duration
  - Mood indicator
  - Vocabulary badges (green pills)
  - Practice sentences (bulleted list)
  - Session notes

#### Understanding the Streak
- Streak counts consecutive days with at least one activity
- Missing a day resets the streak to 0
- Visual encouragement when you maintain a streak
- 7-day calendar highlights active days in purple

## Features Walkthrough

### Enhanced Activity Display
Each logged activity now shows:
- 📅 Date and duration
- 🎯 Activity type
- 😊 Mood indicator
- 📚 New vocabulary as green badges
- 💬 Practice sentences as a list
- 📝 Session notes

### Smart Streak Calculation
- Automatically calculates consecutive learning days
- Handles timezone differences
- Allows for activities logged on different dates
- Shows visual feedback in the 7-day calendar

### Vocabulary Tracking
- Enter words separated by commas
- Automatically converts to array format
- Displays as colored badges
- Counts total words across all sessions
- Shows count per activity

### Time Calculations
- **Input**: Minutes per session
- **Storage**: Both `duration_minutes` and `total_time` fields
- **Display**: Properly converted to hours (÷ 60, one decimal place)
- **7-Day View**: Shows minutes per day for easy tracking

## Field Mappings

### French Learning Activity

| User Input | Database Storage | Display |
|------------|------------------|---------|
| Duration (minutes) | `duration_minutes`, `total_time` | Total Hours (÷ 60) |
| Vocabulary (comma-separated) | `new_vocabulary` (array) | Green badges |
| Sentences (comma-separated) | `practice_sentences` (array) | Bullet list |
| Mood (dropdown) | `mood` (text) | Emoji icons |
| Date | `date` | Formatted date |
| Notes | `notes` | Text paragraph |

### Data Flow
1. **Form Input**: User enters comma-separated strings
2. **Processing**: Strings split into arrays
3. **Storage**: Saved as PostgreSQL arrays
4. **Retrieval**: Fetched as arrays
5. **Display**: Rendered as badges/lists

## Troubleshooting

### Total Hours Not Displaying
- Ensure `total_time` field exists in your database
- Run the migration script from `DATABASE_MIGRATION.md`
- Check browser console for errors

### Vocabulary/Sentences Not Showing
- Verify fields exist: `new_vocabulary`, `practice_sentences`
- Run migration from `DATABASE_MIGRATION_NEW_FIELDS.md`
- Check that data is stored as arrays (not JSON strings)

### Streak Not Calculating
- Ensure you have activities with consecutive dates
- Check that dates are in correct format (YYYY-MM-DD)
- Verify activities are being fetched correctly

### Mood Indicators Missing
- Add the `mood` field to your database
- Ensure CHECK constraint allows: 'good', 'neutral', 'difficult'
- Default value should be 'neutral'

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own learning tracking needs!

## Author

Chris - [RixGem](https://github.com/RixGem)

## Changelog

See `CHANGELOG_FRENCH_FIX.md` for detailed change history.

---

Built with ❤️ using Next.js and Supabase

*Happy Learning! Keep that streak going! 🔥*
