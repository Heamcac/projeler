-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "tokenHash" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CcCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "sort" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "ccCategoryId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "minPrice" INTEGER NOT NULL,
    "maxPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("ccCategoryId", "serviceId"),
    CONSTRAINT "PriceItem_ccCategoryId_fkey" FOREIGN KEY ("ccCategoryId") REFERENCES "CcCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PriceItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "bikeBrand" TEXT NOT NULL,
    "bikeModel" TEXT NOT NULL,
    "bikeYear" INTEGER NOT NULL,
    "plate" TEXT,
    "ccCategoryId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_ccCategoryId_fkey" FOREIGN KEY ("ccCategoryId") REFERENCES "CcCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingService" (
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    PRIMARY KEY ("bookingId", "serviceId"),
    CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkingHours" (
    "weekday" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opens" TEXT NOT NULL,
    "closes" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "slotMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxPerSlot" INTEGER NOT NULL DEFAULT 2
);

-- CreateTable
CREATE TABLE "Holiday" (
    "date" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminSession_adminId_idx" ON "AdminSession"("adminId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");

-- CreateIndex
CREATE INDEX "Booking_date_timeSlot_status_idx" ON "Booking"("date", "timeSlot", "status");

-- CreateIndex
CREATE INDEX "Booking_status_date_idx" ON "Booking"("status", "date");

-- CreateIndex
CREATE INDEX "BookingNote_bookingId_idx" ON "BookingNote"("bookingId");

