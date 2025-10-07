-- Add buyer relationship to orders
ALTER TABLE "Order" ADD COLUMN "buyerId" TEXT;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create order reviews table
CREATE TABLE "OrderReview" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderReview_orderId_key" ON "OrderReview"("orderId");

ALTER TABLE "OrderReview"
  ADD CONSTRAINT "OrderReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderReview"
  ADD CONSTRAINT "OrderReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
