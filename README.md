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
- **AI Integration**: OpenRouter API for daily quote generation

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

Create a `.env.local` file in the root directory based on `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Job Security
CRON_SECRET=your_secure_cron_secret_here

# Test Endpoint Security (optional)
TEST_SECRET=your_secure_test_secret_here
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

## Deployment to Vercel

This project is optimized for deployment on Vercel with automated daily quote generation via cron jobs.

### 🚀 Step-by-Step Deployment Guide

#### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `RixGem/ProgressPath`
4. Vercel will auto-detect Next.js configuration

#### 3. Configure Environment Variables

⚠️ **IMPORTANT**: Never commit sensitive credentials to your repository. Always use Vercel's Environment Variables feature.

In your Vercel project settings:

1. Navigate to **Settings** → **Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development** environments:

##### Required Variables

| Variable Name | Description | Where to Get It |
|--------------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (sensitive) | Supabase Dashboard → Project Settings → API |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI quotes | [OpenRouter Keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL_ID` | AI model to use | Default: `meta-llama/llama-3.1-8b-instruct:free` |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL | `https://your-app.vercel.app` |
| `CRON_SECRET` | Secure secret for cron authentication | Generate with: `openssl rand -base64 32` |
| `TEST_SECRET` | (Optional) Secret for test endpoints | Generate with: `openssl rand -base64 32` |

##### Generate Secure Secrets

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Generate TEST_SECRET
openssl rand -base64 32
```

#### 4. Deploy

1. Click **"Deploy"** in Vercel
2. Vercel will:
   - Install dependencies (`npm install`)
   - Build your Next.js application (`next build`)
   - Deploy to production
3. Your app will be live at `https://your-app.vercel.app`

#### 5. Configure Cron Job (Automatic)

The `vercel.json` configuration automatically sets up a daily cron job:
- **Endpoint**: `/api/cron/daily-quotes`
- **Schedule**: `0 0 * * *` (runs at midnight UTC daily)
- **Purpose**: Generates a new inspirational quote each day

**Security**: The cron endpoint is protected by `CRON_SECRET`. Vercel automatically includes the `Authorization` header when triggering scheduled functions.

#### 6. Verify Deployment

✅ **Post-Deployment Checklist**:

- [ ] Application loads successfully
- [ ] Database connection works (Books and French Learning pages load)
- [ ] Dark mode toggle functions
- [ ] Daily quote displays on homepage
- [ ] All environment variables are set correctly
- [ ] No sensitive data exposed in source code or logs
- [ ] Cron job scheduled (check Vercel Dashboard → Cron)

#### 7. Monitor and Maintain

- **View Logs**: Vercel Dashboard → Your Project → Deployments → View Function Logs
- **Cron Logs**: Check execution logs to ensure daily quotes are generating
- **Update Environment Variables**: Settings → Environment Variables (changes require redeployment)

### 🔒 Security Best Practices

1. **Never hardcode credentials** in `vercel.json` or any committed files
2. **Use Vercel Environment Variables** for all sensitive data
3. **Rotate secrets regularly**, especially if exposed
4. **Enable Vercel Authentication** for preview deployments if needed
5. **Review `.gitignore`** to ensure `.env.local` and `.env.*.local` are excluded
6. **Use different credentials** for development, preview, and production environments

### 🔄 Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For every pull request and branch push

To trigger a redeployment:
```bash
git commit --allow-empty -m "chore: trigger redeployment"
git push
```

### 🐛 Troubleshooting Deployment Issues

#### Build Fails
- Check build logs in Vercel Dashboard
- Verify all dependencies in `package.json`
- Ensure Node.js version compatibility (18+)

#### Environment Variables Not Working
- Confirm variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding/updating environment variables
- Check for typos in variable names

#### Database Connection Errors
- Verify Supabase credentials are correct
- Check Supabase project is active
- Ensure RLS policies allow operations

#### Cron Job Not Running
- Verify `CRON_SECRET` is set in environment variables
- Check cron logs in Vercel Dashboard
- Ensure cron path matches your API route: `/api/cron/daily-quotes`

### 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenRouter API Documentation](https://openrouter.ai/docs)

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
- Quotes automatically rotate at midnight (via Vercel Cron)

### Books Dashboard
1. Click "Add Book" to add a new book to your collection
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

## Database Migration

If you have an existing database, see these migration guides:
- `DATABASE_MIGRATION.md` - For total_time field
- `DATABASE_MIGRATION_NEW_FIELDS.md` - For vocabulary, sentences, and mood fields

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
- Check Vercel cron logs for quote generation issues

### Database Issues
- Verify Supabase connection in `.env.local` or Vercel Environment Variables
- Check table schemas match the SQL commands above
- Review Supabase logs for errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

- **v2.1.0**: Security and deployment improvements
  - Removed hardcoded credentials from vercel.json
  - Added comprehensive Vercel deployment documentation
  - Enhanced security best practices
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
