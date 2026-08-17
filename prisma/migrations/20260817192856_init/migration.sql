-- CreateEnum
CREATE TYPE "Category" AS ENUM ('VIDEO', 'READING', 'GAMING', 'AUDIO', 'LIFE_MOMENTS');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "rating" INTEGER,
    "coverUrl" TEXT,
    "externalLink" TEXT,
    "date" TIMESTAMP(3),
    "shortTake" TEXT,
    "deepReflection" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);
