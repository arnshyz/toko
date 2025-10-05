-- Add storeName column to users
ALTER TABLE "User" ADD COLUMN "storeName" TEXT;

-- Create enum for profile change field if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProfileChangeField') THEN
    CREATE TYPE "ProfileChangeField" AS ENUM ('STORE_NAME', 'EMAIL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProfileChangeStatus') THEN
    CREATE TYPE "ProfileChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END$$;

-- Create table for profile change requests
CREATE TABLE IF NOT EXISTS "ProfileChangeRequest" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "field" "ProfileChangeField" NOT NULL,
  "newValue" TEXT NOT NULL,
  "status" "ProfileChangeStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedById" TEXT,
  CONSTRAINT "ProfileChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfileChangeRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProfileChangeRequest_userId_idx" ON "ProfileChangeRequest" ("userId");
CREATE INDEX IF NOT EXISTS "ProfileChangeRequest_status_idx" ON "ProfileChangeRequest" ("status");

-- Create table for user avatars
CREATE TABLE IF NOT EXISTS "UserAvatar" (
  "userId" TEXT PRIMARY KEY,
  "mimeType" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

