-- Create table for storing seller financial details (sensitive data)
CREATE TABLE IF NOT EXISTS public.seller_financials (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    pix_key TEXT NOT NULL,
    pix_key_type TEXT NOT NULL DEFAULT 'cpf', -- email, phone, random, cpf, cnpj
    cpf TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.seller_financials ENABLE ROW LEVEL SECURITY;

-- Policies for seller_financials
CREATE POLICY "Users can view their own financial details" 
ON public.seller_financials FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial details" 
ON public.seller_financials FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial details" 
ON public.seller_financials FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all financial details (to pay)
CREATE POLICY "Admins can view all financial details" 
ON public.seller_financials FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);


-- Create table for withdrawal requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, rejected
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies for withdrawals
CREATE POLICY "Users can view their own withdrawals" 
ON public.withdrawals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert withdrawal requests" 
ON public.withdrawals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" 
ON public.withdrawals FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update withdrawals" 
ON public.withdrawals FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
