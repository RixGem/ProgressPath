-- User Profiles Table Migration
-- This migration creates the user_profiles table required for comprehensive user sync

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  -- Primary key that references auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Profile information
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- User preferences stored as JSON
  preferences JSONB DEFAULT '{"theme": "system", "language": "en"}',
  
  -- User settings
  email_notifications BOOLEAN DEFAULT TRUE,
  
  -- Learning stats
  total_books_read INTEGER DEFAULT 0,
  total_pages_read INTEGER DEFAULT 0,
  french_streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  
  -- Additional fields can be added as needed
  extra_data JSONB DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON public.user_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON public.user_profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON public.user_profiles(account_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_profile_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_update_user_profile_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profile_updated_at();

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Optional: Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile_updated_at() TO authenticated;

-- Create a view for user profile with auth data (optional)
CREATE OR REPLACE VIEW public.user_profiles_with_auth AS
SELECT 
  up.*,
  au.email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id;

-- Grant select on view
GRANT SELECT ON public.user_profiles_with_auth TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.user_profiles IS 'User profile information and preferences';
COMMENT ON COLUMN public.user_profiles.id IS 'User ID - references auth.users(id)';
COMMENT ON COLUMN public.user_profiles.preferences IS 'User preferences stored as JSON (theme, language, etc.)';
COMMENT ON COLUMN public.user_profiles.extra_data IS 'Additional flexible data storage for future features';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user signs up';

-- Verification query (uncomment to test)
-- SELECT * FROM public.user_profiles WHERE id = auth.uid();
