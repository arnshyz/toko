CREATE TABLE "SiteSetting" (
  "id" TEXT PRIMARY KEY,
  "siteName" TEXT NOT NULL,
  "siteDescription" TEXT,
  "logoUrl" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO "SiteSetting" ("id", "siteName", "siteDescription")
VALUES ('site', 'Akay Nusantara', 'Belanja produk pilihan dari penjual terpercaya di seluruh Nusantara')
ON CONFLICT ("id") DO NOTHING;
