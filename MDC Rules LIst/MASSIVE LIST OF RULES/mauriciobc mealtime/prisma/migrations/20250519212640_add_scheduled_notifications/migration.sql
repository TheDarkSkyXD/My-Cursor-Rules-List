-- CreateTable
CREATE TABLE "public"."ScheduledNotification" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "catId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deliverAt" TIMESTAMPTZ(6) NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledNotification_delivered_deliverAt_idx" ON "public"."ScheduledNotification"("delivered", "deliverAt");
