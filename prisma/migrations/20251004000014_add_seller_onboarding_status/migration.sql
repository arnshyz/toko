CREATE TYPE "SellerOnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACTIVE');

ALTER TABLE "User"
  ADD COLUMN "sellerOnboardingStatus" "SellerOnboardingStatus" NOT NULL DEFAULT 'ACTIVE';
