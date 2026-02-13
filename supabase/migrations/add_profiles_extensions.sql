-- Add bio and location to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Policy allow users to update their own bio and location
-- Assuming "Users can update own profile" policy exists and covers all columns or we need to check.
-- Usually policies are ON UPDATE TO profiles USING (auth.uid() = id) WITH CHECK (auth.uid() = id).
-- If column security is not enabled, this works.

-- Create function to get seller reviews if not simple select
-- Actually simple select on reviews table filtering by seller_id is enough.
