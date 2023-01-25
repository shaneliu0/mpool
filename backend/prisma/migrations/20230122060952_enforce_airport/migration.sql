-- AlterTable
ALTER TABLE "PoolSeason" ADD COLUMN     "enforceFromAirport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enforceToAirport" BOOLEAN NOT NULL DEFAULT false;
