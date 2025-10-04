-- Add variantOptions column to Product if it is missing
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "variantOptions" JSONB;
