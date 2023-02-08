-- AlterTable
ALTER TABLE "University" ADD COLUMN     "shortTimeZoneName" TEXT NOT NULL DEFAULT 'EST',
ADD COLUMN     "timeZoneOffsetFromEST" INTEGER NOT NULL DEFAULT 0;
