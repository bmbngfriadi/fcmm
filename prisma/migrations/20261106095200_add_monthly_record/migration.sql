-- CreateTable
CREATE TABLE IF NOT EXISTS "MonthlyRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "category" "Category" NOT NULL,
    "colorMode" "ColorMode" NOT NULL,
    "startMeter" INTEGER,
    "endMeter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyRecord_userId_month_year_category_colorMode_key" ON "MonthlyRecord"("userId", "month", "year", "category", "colorMode");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MonthlyRecord_userId_fkey'
    ) THEN
        ALTER TABLE "MonthlyRecord" ADD CONSTRAINT "MonthlyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
