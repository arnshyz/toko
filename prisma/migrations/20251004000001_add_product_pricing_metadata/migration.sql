ALTER TABLE "Product"
  ADD COLUMN "originalPrice" INTEGER,
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'umum';
