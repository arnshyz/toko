-- Enums
CREATE TYPE "OrderStatus"   AS ENUM ('PENDING','PAID','CANCELLED');
CREATE TYPE "ItemStatus"    AS ENUM ('PENDING','PACKED','SHIPPED','DELIVERED');
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER','COD');
CREATE TYPE "VoucherKind"   AS ENUM ('PERCENT','FIXED');
CREATE TYPE "ReturnStatus"  AS ENUM ('REQUESTED','APPROVED','REJECTED','RECEIVED','REFUND_ISSUED');

-- User
CREATE TABLE "User" (
  "id"           TEXT PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "slug"         TEXT NOT NULL UNIQUE,
  "isAdmin"      BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Warehouse
CREATE TABLE "Warehouse" (
  "id"        TEXT PRIMARY KEY,
  "ownerId"   TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "city"      TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Warehouse_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Product
CREATE TABLE "Product" (
  "id"           TEXT PRIMARY KEY,
  "sellerId"     TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "price"        INTEGER NOT NULL,
  "stock"        INTEGER NOT NULL DEFAULT 0,
  "imageUrl"     TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "warehouseId"  TEXT,
  CONSTRAINT "Product_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "Product_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- Order
CREATE TABLE "Order" (
  "id"               TEXT PRIMARY KEY,
  "orderCode"        TEXT NOT NULL UNIQUE,
  "buyerName"        TEXT NOT NULL,
  "buyerPhone"       TEXT NOT NULL,
  "buyerAddress"     TEXT NOT NULL,
  "courier"          TEXT NOT NULL,
  "shippingCost"     INTEGER NOT NULL,
  "status"           "OrderStatus"   NOT NULL DEFAULT 'PENDING',
  "paymentMethod"    "PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
  "uniqueCode"       INTEGER NOT NULL DEFAULT 0,
  "itemsTotal"       INTEGER NOT NULL,
  "totalWithUnique"  INTEGER NOT NULL,
  "voucherCode"      TEXT,
  "voucherDiscount"  INTEGER NOT NULL DEFAULT 0,
  "proofImage"       BYTEA,
  "proofMimeType"    TEXT,
  "createdAt"        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- OrderItem
CREATE TABLE "OrderItem" (
  "id"        TEXT PRIMARY KEY,
  "orderId"   TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sellerId"  TEXT NOT NULL,
  "qty"       INTEGER NOT NULL,
  "price"     INTEGER NOT NULL,
  "status"    "ItemStatus" NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "OrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "OrderItem_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Voucher
CREATE TABLE "Voucher" (
  "id"        TEXT PRIMARY KEY,
  "code"      TEXT NOT NULL UNIQUE,
  "kind"      "VoucherKind" NOT NULL,
  "value"     INTEGER NOT NULL,
  "minSpend"  INTEGER NOT NULL DEFAULT 0,
  "active"    BOOLEAN NOT NULL DEFAULT TRUE,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ReturnRequest
CREATE TABLE "ReturnRequest" (
  "id"          TEXT PRIMARY KEY,
  "orderId"     TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "status"      "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  "reason"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "ReturnRequest_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "ReturnRequest_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- VerificationLog
CREATE TABLE "VerificationLog" (
  "id"        TEXT PRIMARY KEY,
  "orderId"   TEXT NOT NULL,
  "actor"     TEXT NOT NULL,
  "action"    TEXT NOT NULL,
  "note"      TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "VerificationLog_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Index tambahan (opsional)
CREATE INDEX "idx_product_seller"    ON "Product"("sellerId");
CREATE INDEX "idx_product_warehouse" ON "Product"("warehouseId");
CREATE INDEX "idx_order_status"      ON "Order"("status");
CREATE INDEX "idx_order_createdAt"   ON "Order"("createdAt");
CREATE INDEX "idx_orderitem_order"   ON "OrderItem"("orderId");
CREATE INDEX "idx_return_item"       ON "ReturnRequest"("orderItemId");
