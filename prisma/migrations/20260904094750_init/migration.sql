-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'LEADER');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('PRINT', 'COPY', 'SCAN');

-- CreateEnum
CREATE TYPE "ColorMode" AS ENUM ('BW', 'COLOR', 'NONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "colorMode" "ColorMode" NOT NULL,
    "initial" INTEGER,
    "week1" INTEGER,
    "week2" INTEGER,
    "week3" INTEGER,
    "week4" INTEGER,
    "week5" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFile" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "week" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Record_userId_month_year_category_colorMode_key" ON "Record"("userId", "month", "year", "category", "colorMode");

-- CreateIndex
CREATE UNIQUE INDEX "ReportFile_month_year_category_week_key" ON "ReportFile"("month", "year", "category", "week");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
