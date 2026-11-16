-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('BOOKING_CREATED', 'OWNER_NEW_BOOKING', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED', 'OWNER_CUSTOMER_CANCELLED', 'REMINDER_EARLY', 'REMINDER_LATE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "tokenHash" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "LoginThrottle" (
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CcCategory" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "CcCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "ccCategoryId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "minPrice" INTEGER NOT NULL,
    "maxPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("ccCategoryId","serviceId")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
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
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationConsentAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "anonymizedAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "event" "NotificationEvent" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingService" (
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("bookingId","serviceId")
);

-- CreateTable
CREATE TABLE "BookingNote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingHours" (
    "weekday" INTEGER NOT NULL,
    "opens" TEXT NOT NULL,
    "closes" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "slotMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxPerSlot" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("weekday")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "date" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("date")
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
CREATE INDEX "LoginThrottle_expiresAt_idx" ON "LoginThrottle"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");

-- CreateIndex
CREATE INDEX "Booking_date_timeSlot_status_idx" ON "Booking"("date", "timeSlot", "status");

-- CreateIndex
CREATE INDEX "Booking_status_date_idx" ON "Booking"("status", "date");

-- CreateIndex
CREATE INDEX "Booking_anonymizedAt_date_idx" ON "Booking"("anonymizedAt", "date");

-- CreateIndex
CREATE INDEX "NotificationLog_status_nextAttemptAt_idx" ON "NotificationLog"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "NotificationLog_bookingId_createdAt_idx" ON "NotificationLog"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_bookingId_event_channel_key" ON "NotificationLog"("bookingId", "event", "channel");

-- CreateIndex
CREATE INDEX "BookingNote_bookingId_idx" ON "BookingNote"("bookingId");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_ccCategoryId_fkey" FOREIGN KEY ("ccCategoryId") REFERENCES "CcCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ccCategoryId_fkey" FOREIGN KEY ("ccCategoryId") REFERENCES "CcCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingNote" ADD CONSTRAINT "BookingNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Booking_active_phone_slot_key" ON "Booking" ("date", "timeSlot", "phone") WHERE "status" <> 'CANCELLED' AND "anonymizedAt" IS NULL;
