-- AlterTable
ALTER TABLE "UserAddress"
  ADD COLUMN "provinceId" TEXT,
  ADD COLUMN "cityId" TEXT,
  ADD COLUMN "districtId" TEXT,
  ALTER COLUMN "postalCode" DROP NOT NULL;
