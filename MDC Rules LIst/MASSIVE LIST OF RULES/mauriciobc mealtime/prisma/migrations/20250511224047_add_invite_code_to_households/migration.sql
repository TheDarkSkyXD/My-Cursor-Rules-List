/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `households` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."households" ADD COLUMN     "inviteCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "households_inviteCode_key" ON "public"."households"("inviteCode");
