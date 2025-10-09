CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "emoji" TEXT,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Category"("id")
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "Category_sort_idx" ON "Category"("sortOrder", "name");

CREATE TABLE "Courier" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "fallbackCost" INTEGER NOT NULL DEFAULT 0,
  "rajaOngkirCourier" TEXT NOT NULL,
  "rajaOngkirService" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "Courier_key_key" ON "Courier"("key");
CREATE INDEX "Courier_active_idx" ON "Courier"("isActive", "sortOrder");
