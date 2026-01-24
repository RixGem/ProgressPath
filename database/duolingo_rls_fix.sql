-- Enable Row Level Security on the table
ALTER TABLE duolingo_activity ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view ONLY their own rows
-- This matches the 'user_id' column in the table with the currently logged-in user's ID
CREATE POLICY "Users can view own duolingo activity"
ON duolingo_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Optional: Allow users to insert their own data (if needed)
CREATE POLICY "Users can insert own duolingo activity"
ON duolingo_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);
