ALTER TABLE "PasswordResetToken"
  ADD COLUMN     "tokenHash" TEXT;

UPDATE "PasswordResetToken"
SET "tokenHash" = "otpHash"
WHERE "tokenHash" IS NULL;

ALTER TABLE "PasswordResetToken"
  ALTER COLUMN "tokenHash" SET NOT NULL;

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

ALTER TABLE "PasswordResetToken"
  DROP COLUMN "otpHash";
