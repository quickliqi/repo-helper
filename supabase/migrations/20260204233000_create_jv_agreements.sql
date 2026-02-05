-- Create jv_agreements table
CREATE TABLE IF NOT EXISTS public.jv_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID REFERENCES public.profiles(user_id) NOT NULL,
    wholesaler_id UUID REFERENCES public.profiles(user_id) NOT NULL,
    property_id UUID REFERENCES public.properties(id) NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pdf_url TEXT, -- In case we want to store it late
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(investor_id, property_id)
);

-- RLS
ALTER TABLE public.jv_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own JV agreements"
    ON public.jv_agreements
    FOR SELECT
    USING (auth.uid() = investor_id OR auth.uid() = wholesaler_id);

CREATE POLICY "Investors can create JV agreements"
    ON public.jv_agreements
    FOR INSERT
    WITH CHECK (auth.uid() = investor_id);

-- Index for gating messaging Check
CREATE INDEX idx_jv_agreements_investor_property ON public.jv_agreements(investor_id, property_id);
