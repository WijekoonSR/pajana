-- Every cast image is public; the per-image rights flag is gone.
ALTER TABLE "ProfileMedia" DROP COLUMN "usageApproved";
