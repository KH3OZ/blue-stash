-- Widen rating to support half-star increments (e.g. 3.5)
ALTER TABLE "Entry" ALTER COLUMN "rating" TYPE DOUBLE PRECISION;
