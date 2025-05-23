/*
  Warnings:

  - Added the required column `goal_name` to the `weight_goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `weight_goals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."weight_goals" ADD COLUMN     "goal_name" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;
