import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

let isTableInitialized = false;

async function ensureTableExists() {
  if (isTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
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
        CONSTRAINT "MonthlyRecord_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "MonthlyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyRecord_userId_month_year_category_colorMode_key" ON "MonthlyRecord"("userId", "month", "year", "category", "colorMode");
    `);
    isTableInitialized = true;
  } catch (err) {
    console.warn("Auto-migrate check for MonthlyRecord table:", err);
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTableExists();

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  try {
    const isElevated = session.user.role === "ADMIN" || session.user.role === "LEADER";
    const userFilter = isElevated ? {} : { userId: session.user.id };

    // 1. Fetch monthly records
    const monthlyRecords = await prisma.monthlyRecord.findMany({
      where: {
        month,
        year,
        ...userFilter,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    });

    // 2. Fetch corresponding weekly records to calculate comparison & gap
    const weeklyRecords = await prisma.record.findMany({
      where: {
        month,
        year,
        ...userFilter,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    });

    // Calculate weekly total usage per userId -> category -> colorMode
    const weeklyUsageMap: Record<string, Record<string, Record<string, number | null>>> = {};
    weeklyRecords.forEach((r) => {
      let lastVal: number | null = null;
      if (r.week5 != null) lastVal = r.week5;
      else if (r.week4 != null) lastVal = r.week4;
      else if (r.week3 != null) lastVal = r.week3;
      else if (r.week2 != null) lastVal = r.week2;
      else if (r.week1 != null) lastVal = r.week1;

      const usage = (lastVal != null && r.initial != null) ? Math.max(0, lastVal - r.initial) : null;

      if (!weeklyUsageMap[r.userId]) weeklyUsageMap[r.userId] = {};
      if (!weeklyUsageMap[r.userId][r.category]) weeklyUsageMap[r.userId][r.category] = {};
      weeklyUsageMap[r.userId][r.category][r.colorMode] = usage;
    });

    // Check if there are saved startDate and endDate from the first record
    let savedStartDate: string | null = null;
    let savedEndDate: string | null = null;
    if (monthlyRecords.length > 0) {
      const withDates = monthlyRecords.find((m) => m.startDate && m.endDate);
      if (withDates && withDates.startDate && withDates.endDate) {
        savedStartDate = withDates.startDate.toISOString().split("T")[0];
        savedEndDate = withDates.endDate.toISOString().split("T")[0];
      }
    }

    return NextResponse.json({
      monthlyRecords,
      weeklyUsageMap,
      savedStartDate,
      savedEndDate,
    });
  } catch (error) {
    console.error("Error fetching monthly records:", error);
    return NextResponse.json({ error: "Failed to fetch monthly records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTableExists();

  try {
    const body = await req.json();
    const { month, year, startDate, endDate, records } = body;

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const startDateTime = startDate ? new Date(startDate) : null;
    const endDateTime = endDate ? new Date(endDate) : null;

    const isAdmin = session.user.role === "ADMIN";

    const promises = records.map(async (record: any) => {
      // Non-admins can only save their own records
      if (!isAdmin && record.userId !== session.user.id) {
        return;
      }

      await prisma.monthlyRecord.upsert({
        where: {
          userId_month_year_category_colorMode: {
            userId: record.userId,
            month,
            year,
            category: record.category,
            colorMode: record.colorMode,
          },
        },
        update: {
          startMeter: record.startMeter === "" || record.startMeter == null ? null : Number(record.startMeter),
          endMeter: record.endMeter === "" || record.endMeter == null ? null : Number(record.endMeter),
          startDate: startDateTime,
          endDate: endDateTime,
        },
        create: {
          userId: record.userId,
          month,
          year,
          category: record.category,
          colorMode: record.colorMode,
          startMeter: record.startMeter === "" || record.startMeter == null ? null : Number(record.startMeter),
          endMeter: record.endMeter === "" || record.endMeter == null ? null : Number(record.endMeter),
          startDate: startDateTime,
          endDate: endDateTime,
        },
      });
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving monthly records:", error);
    return NextResponse.json({ error: "Failed to save monthly records" }, { status: 500 });
  }
}
