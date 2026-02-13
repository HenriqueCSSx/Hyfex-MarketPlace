-- Create table for product questions (Q&A)
CREATE TABLE IF NOT EXISTS public.product_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- User asking the question
    question TEXT NOT NULL,
    answer TEXT, -- Seller's answer
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Everyone can view questions (public Q&A on product page)
CREATE POLICY "Public questions are viewable by everyone" 
ON public.product_questions FOR SELECT 
USING (true);

-- 2. Authenticated users can ask questions
CREATE POLICY "Users can create questions" 
ON public.product_questions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Only the seller of the product can answer (update) the question
-- Note: This is a complex policy joined with products table. 
-- For performance/simplicity in MVP, we might handle this verification in the application layer 
-- or use a security definer function, but RLS is cleaner if possible.
CREATE POLICY "Sellers can answer questions on their products" 
ON public.product_questions FOR UPDATE 
USING (
  exists (
    select 1 from public.products
    where products.id = product_questions.product_id
    and products.seller_id = auth.uid()
  )
)
WITH CHECK (
  exists (
    select 1 from public.products
    where products.id = product_questions.product_id
    and products.seller_id = auth.uid()
  )
);

-- 4. Users can delete their own unanswered questions (optional)
CREATE POLICY "Users can delete own unanswered questions" 
ON public.product_questions FOR DELETE 
USING (auth.uid() = user_id AND answer IS NULL);
