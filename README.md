# ProgressPath - Learning Tracker

A modern Next.js application to track your learning progress across books and languages with comprehensive analytics, streak tracking, dark mode, and daily inspirational quotes.

## ✨ Latest Features

### 🌙 Dark Mode
- **One-Click Toggle**: Switch between light and dark themes with the sun/moon button in the navigation bar
- **Persistent Preference**: Your theme choice is saved in localStorage
- **Full Coverage**: All pages (Home, Books, French Learning) support dark mode
- **Eye-Friendly**: Carefully selected color palette with excellent contrast ratios for comfortable nighttime reading

### 💬 Daily Inspirational Quotes
- **Rotating Quotes**: 18 curated inspirational quotes that change daily
- **Categories**: Personal Growth, Learning, and Philosophy
- **Elegant Design**: Italic styling with author attribution
- **Motivation**: Start each day with a fresh dose of inspiration on the homepage

## Features

### 📚 Books Dashboard
- Add and manage your book collection
- Track reading progress with visual progress bars
- Categorize books by status (To Read, Reading, Completed)
- Add genres, ratings (1-5 stars), and reading dates
- Language analysis and personal notes
- Edit and update book information
- Monitor reading statistics
- **Dark mode support** for comfortable reading

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
  - Current learning streak with flame icon 🔥
  - Total sessions completed
  - Total vocabulary words learned
  - 7-day activity calendar showing daily minutes
- **Comprehensive Activity Log**: View all past activities with vocabulary badges and sentence lists
- **Session Notes**: Add detailed notes for each learning session
- **Dark mode support** for late-night study sessions

### 🏠 Homepage Experience
- Personalized greeting: "Hey Chris! Ready to Level Up?"
- **Daily rotating inspirational quote** (changes every day)
- Quick access cards to Books and French Learning
- Chris's Learning Principles section
- **Dark mode** for a comfortable viewing experience

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS with dark mode support
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel
- **State Management**: React Hooks
- **Storage**: localStorage for theme preference

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
  progress DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'reading',
  genre TEXT,
  rating INTEGER,
  language_analysis TEXT,
  notes TEXT,
  date_started DATE,
  date_finished DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
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

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Using Dark Mode
1. Click the **sun/moon icon** in the top-right navigation bar
2. The theme will switch instantly
3. Your preference is automatically saved
4. Works on all pages: Home, Books, French Learning

### Daily Quotes
- A new inspirational quote appears on the homepage each day
- Quotes cover personal growth, learning, and philosophical wisdom
- The same quote displays throughout the day for consistency
- Quotes automatically rotate at midnight

### Books Dashboard
1. Click \"Add Book\" to add a new book to your collection
2. Fill in the book details (title, author, progress percentage)
3. Add optional information:
   - Genre/Category
   - Rating (1-5 stars)
   - Start and finish dates
   - Language analysis notes
   - Personal reflections
4. Update your reading progress anytime by editing the book
5. Track your overall reading statistics
6. **Toggle dark mode** for comfortable nighttime reading

### French Learning Dashboard

#### Logging an Activity
1. Click \"Log Activity\" to open the form
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
9. Click \"Log Activity\" to save

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

## Database Migration

If you have an existing database, see these migration guides:
- `DATABASE_MIGRATION.md` - For total_time field
- `DATABASE_MIGRATION_NEW_FIELDS.md` - For vocabulary, sentences, and mood fields

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy!

Vercel will automatically deploy updates when you push to the main branch.

## Theme Customization

### Light Mode Colors
- Background: Gradient from blue-50 via white to purple-50
- Text: Gray-900 (headings), Gray-600 (body)
- Cards: White with subtle shadows
- Primary: Blue (#0284c7)

### Dark Mode Colors
- Background: Gradient from gray-900 via gray-800 to gray-900
- Text: White (headings), Gray-300 (body)
- Cards: Gray-800 with gray-700 borders
- Primary: Blue (#38bdf8)

All colors meet WCAG AA contrast standards for accessibility.

## Quote Collection

The daily quotes feature includes 18 inspirational quotes:
- **7 Personal Growth quotes** from Steve Jobs, Winston Churchill, Theodore Roosevelt, Eleanor Roosevelt, Confucius, George Addair, and Tony Robbins
- **7 Learning quotes** from Nelson Mandela, B.B. King, Mahatma Gandhi, Brian Herbert, Leonardo da Vinci, Benjamin Franklin, and Helen Hayes
- **4 Philosophy quotes** from Socrates, René Descartes, and Friedrich Nietzsche

## Troubleshooting

### Dark Mode Issues
- Clear browser cache if theme doesn't persist
- Check browser console for localStorage errors
- Ensure JavaScript is enabled

### Quotes Not Displaying
- Check browser console for errors
- Verify component is imported correctly
- Ensure the DailyQuote component is rendering

### Database Issues
- Verify Supabase connection in `.env.local`
- Check table schemas match the SQL commands above
- Review Supabase logs for errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

- **v2.0.0**: Added Dark Mode and Daily Inspirational Quotes
  - See `CHANGELOG_DARK_MODE_AND_QUOTES.md` for details
- **v1.5.0**: Enhanced French Learning features
  - See `CHANGELOG_FRENCH_FIX.md` for details
- **v1.0.0**: Initial release with Books and French Learning tracking

## License

MIT License - feel free to use this project for your own learning tracking needs!

## Author

Chris - [RixGem](https://github.com/RixGem)

---

Built with ❤️ using Next.js and Supabase

**All powered by Poke ~** ✨

*Happy Learning! Keep that streak going! 🔥*

**Pro tip**: Try dark mode for your late-night study sessions! 🌙
