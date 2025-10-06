ALTER TABLE "Order"
  ADD COLUMN "midtransTransactionId" TEXT,
  ADD COLUMN "midtransOrderId" TEXT,
  ADD COLUMN "midtransStatus" TEXT,
  ADD COLUMN "midtransPaymentType" TEXT,
  ADD COLUMN "midtransFraudStatus" TEXT;
