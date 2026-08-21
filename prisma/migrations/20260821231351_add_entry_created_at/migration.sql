-- Track when an entry was actually saved ("posted"), separate from the
-- user-editable event `date`, so it can be shown as a time and used as a
-- same-day sort tiebreaker.
ALTER TABLE "Entry" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
