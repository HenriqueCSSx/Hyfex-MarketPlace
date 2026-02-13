-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    product_id UUID REFERENCES public.products(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT conversations_distinct_participants CHECK (buyer_id != seller_id)
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their own conversations"
    ON public.conversations
    FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages in their conversations"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation timestamp
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_timestamp();
