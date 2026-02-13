-- Create table for activation chat messages between sellers and admin
CREATE TABLE IF NOT EXISTS public.activation_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- The seller requesting activation
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who sent this message (seller or admin)
    message TEXT, -- Text message (optional if image is attached)
    image_url TEXT, -- Attached image (payment proof, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activation_chats ENABLE ROW LEVEL SECURITY;

-- 1. Admin can see all messages
CREATE POLICY "Admins can see all activation chats"
ON public.activation_chats FOR SELECT
USING (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.roles @> '["admin"]'::jsonb
    )
);

-- 2. Sellers can see their own activation messages
CREATE POLICY "Sellers can see their own activation chats"
ON public.activation_chats FOR SELECT
USING (user_id = auth.uid());

-- 3. Authenticated users can insert messages in their own activation thread, or admin in any
CREATE POLICY "Users can send activation messages"
ON public.activation_chats FOR INSERT
WITH CHECK (
    sender_id = auth.uid()
    AND (
        user_id = auth.uid()
        OR exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.roles @> '["admin"]'::jsonb
        )
    )
);

-- Add activation_requested field to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'activation_requested'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN activation_requested BOOLEAN DEFAULT false;
    END IF;
END $$;
