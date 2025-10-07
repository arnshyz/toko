ALTER TABLE "Product" ADD COLUMN "slug" TEXT;

WITH normalized AS (
  SELECT
    "id",
    COALESCE(
      NULLIF(
        TRIM(BOTH '-' FROM REGEXP_REPLACE(
          REGEXP_REPLACE(LOWER("title"), '\s+', '-', 'g'),
          '[^a-z0-9-]',
          '',
          'g'
        )),
        ''
      ),
      "id"
    ) AS base_slug
  FROM "Product"
), numbered AS (
  SELECT
    "id",
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY "id") AS occurrence
  FROM normalized
)
UPDATE "Product" AS p
SET "slug" = CASE
  WHEN numbered.occurrence = 1 THEN numbered.base_slug
  ELSE numbered.base_slug || '-' || (numbered.occurrence - 1)
END
FROM numbered
WHERE numbered.id = p."id";

ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
