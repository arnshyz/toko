-- This migration intentionally removes the obsolete variantOptions column.
-- It replaces a previously failed attempt that tried to add the column.
-- The IF EXISTS guard keeps the migration idempotent so `migrate deploy`
-- can mark the failed migration as resolved without requiring manual steps.
ALTER TABLE "Product" DROP COLUMN IF EXISTS "variantOptions";
