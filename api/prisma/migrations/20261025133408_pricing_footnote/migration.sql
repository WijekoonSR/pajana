/*
  Warnings:

  - Added the required column `pricingFootnote` to the `SiteSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "pricingFootnote" JSONB NOT NULL;
