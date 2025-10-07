CREATE TABLE "UserVoucher" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "voucherId" TEXT NOT NULL,
  "claimedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "usedAt"    TIMESTAMP,
  CONSTRAINT "UserVoucher_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "UserVoucher_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id")
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE UNIQUE INDEX "UserVoucher_user_voucher_unique" ON "UserVoucher"("userId", "voucherId");
CREATE INDEX "UserVoucher_user_idx" ON "UserVoucher"("userId");
CREATE INDEX "UserVoucher_voucher_idx" ON "UserVoucher"("voucherId");
