/*
  Warnings:

  - You are about to drop the `scheduledNotification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."scheduledNotification";

-- CreateTable
CREATE TABLE "public"."scheduledNotification" (
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

    CONSTRAINT "scheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduledNotification_delivered_deliverAt_idx" ON "public"."scheduledNotification"("delivered", "deliverAt");
