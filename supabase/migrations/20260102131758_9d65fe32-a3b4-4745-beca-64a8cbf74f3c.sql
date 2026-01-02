-- Add actively seeking status for investors
ALTER TABLE public.profiles 
ADD COLUMN is_actively_buying boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_actively_buying IS 'Indicates if investor is currently seeking to purchase properties';