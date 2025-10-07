-- CreateTable
CREATE TABLE "OrderReviewHelpful" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderReviewHelpful_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderReviewHelpful_reviewId_userId_key" ON "OrderReviewHelpful"("reviewId", "userId");

-- AddForeignKey
ALTER TABLE "OrderReviewHelpful" ADD CONSTRAINT "OrderReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "OrderReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderReviewHelpful" ADD CONSTRAINT "OrderReviewHelpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
