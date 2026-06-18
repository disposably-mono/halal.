-- AlterEnum
-- Adds the SUPERADMIN (COMELEC account) and CANVASSER (Canvassing Head) roles.
-- This migration ONLY adds enum values; do not combine with statements that
-- consume the new values in the same file (Postgres forbids using a freshly
-- added enum value within the transaction that adds it).
ALTER TYPE "AdminRole" ADD VALUE 'SUPERADMIN';
ALTER TYPE "AdminRole" ADD VALUE 'CANVASSER';
