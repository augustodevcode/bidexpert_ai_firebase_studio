-- Migration: Create EmailLog table and EmailStatus enum for Neon (PostgreSQL)
-- Run once against the Neon demo-stable database

DO $$ BEGIN
  CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id"               BIGSERIAL PRIMARY KEY,
  "recipient"        TEXT NOT NULL,
  "subject"          TEXT NOT NULL,
  "content"          TEXT NOT NULL,
  "provider"         TEXT NOT NULL,
  "status"           "EmailStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt"           TIMESTAMP(3),
  "errorMessage"     TEXT,
  "contactMessageId" BIGINT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
