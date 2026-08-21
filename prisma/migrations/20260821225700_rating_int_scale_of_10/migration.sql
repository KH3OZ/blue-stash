-- Rescale rating from a 0-5 scale to a 0-10 integer scale, preserving relative rating
ALTER TABLE "Entry" ALTER COLUMN "rating" TYPE INTEGER USING ROUND("rating" * 2)::INTEGER;
