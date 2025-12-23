# ProgressPath - Learning Tracker

A modern Next.js application to track your learning progress across books and languages.

## Features

### 📚 Books Dashboard
- Add and manage your book collection
- Track reading progress with visual progress bars
- Categorize books by status (To Read, Reading, Completed)
- Edit and update book information
- Monitor reading statistics

### 🇫🇷 French Learning Dashboard
- Log daily learning activities
- Track different activity types (vocabulary, grammar, reading, listening, speaking, writing)
- Monitor learning duration and consistency
- View learning streak visualization
- Add notes for each learning session
- Automatic total time calculation from total_time field

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Database**: Supabase
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

-- Create french_learning table with total_time field
CREATE TABLE french_learning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_time INTEGER NOT NULL,  -- Total time in minutes (used for aggregated display)
  notes TEXT,
  date DATE NOT NULL,
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
- `id`: Unique identifier (UUID)
- `activity_type`: Type of learning activity (vocabulary, grammar, reading, listening, speaking, writing, exercise)
- `duration_minutes`: Duration of the session in minutes (backward compatibility)
- `total_time`: Total time in minutes (primary field for time calculations and automation)
- `notes`: Optional notes about the learning session
- `date`: Date of the activity
- `created_at`: Timestamp of record creation

**Important**: The `total_time` field is used for calculating Total Hours displayed on the dashboard and should match automation scripts.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
1. Click "Log Activity" to record a learning session
2. Select the activity type (vocabulary, grammar, etc.)
3. Enter the duration and optional notes
4. View your learning streak and total hours (calculated from total_time field)

## Field Mappings

### French Learning Activity
- **Frontend field**: `duration_minutes`
- **Database fields**: 
  - `duration_minutes` (for backward compatibility)
  - `total_time` (primary field for calculations)
- **Display**: Total Hours uses aggregated `total_time` from database

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own learning tracking needs!

## Author

Chris - [RixGem](https://github.com/RixGem)

---

Built with ❤️ using Next.js and Supabase
