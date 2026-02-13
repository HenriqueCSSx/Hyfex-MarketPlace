-- Create table for disputes
CREATE TABLE IF NOT EXISTS public.order_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    opener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- User who opened the dispute (buyer)
    seller_id UUID NOT NULL REFERENCES public.profiles(id), -- Seller involved (denormalized for ease, or joined via order)
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved_refund', 'resolved_release', 'cancelled')),
    admin_notes TEXT,
    resolution_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Admins can view all disputes
CREATE POLICY "Admins can view all disputes" 
ON public.order_disputes FOR SELECT 
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

-- 2. Users can view disputes they opened
CREATE POLICY "Users can view own disputes" 
ON public.order_disputes FOR SELECT 
USING (auth.uid() = opener_id);

-- 3. Sellers can view disputes against them
CREATE POLICY "Sellers can view disputes against them" 
ON public.order_disputes FOR SELECT 
USING (auth.uid() = seller_id);

-- 4. Buyers can create disputes for their orders
CREATE POLICY "Buyers can open disputes" 
ON public.order_disputes FOR INSERT 
WITH CHECK (auth.uid() = opener_id);

-- 5. Admins can update disputes (resolve them)
CREATE POLICY "Admins can update disputes" 
ON public.order_disputes FOR UPDATE 
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

-- Note: We might also want to update the 'orders' table status when a dispute is opened/resolved.
