ALTER TABLE "Booking" ADD COLUMN "notificationConsentAt" DATETIME;

CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "nextAttemptAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NotificationLog_bookingId_event_channel_key" ON "NotificationLog"("bookingId", "event", "channel");
CREATE INDEX "NotificationLog_status_nextAttemptAt_idx" ON "NotificationLog"("status", "nextAttemptAt");
CREATE INDEX "NotificationLog_bookingId_createdAt_idx" ON "NotificationLog"("bookingId", "createdAt");
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");
