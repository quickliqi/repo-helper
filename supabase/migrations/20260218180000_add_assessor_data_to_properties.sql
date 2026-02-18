-- Add assessor_data JSONB column to properties table to store public record validation data
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS assessor_data JSONB;

-- Comment to explain the purpose of the column
COMMENT ON COLUMN public.properties.assessor_data IS 'Official data from county assessor records (APN, SqFt, Bed/Bath, Taxes, etc.) for deal validation.';
