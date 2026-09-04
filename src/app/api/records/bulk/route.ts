import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { month, year, records } = await req.json();

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Process each record sequentially (or in a transaction if needed, but sequential is fine for this scale)
    const promises = records.map(async (record: any) => {
      // Ensure only Admin can update other users' records
      if (session.user.role !== "ADMIN" && record.userId !== session.user.id) {
        return; // Skip unauthorized updates
      }

      await prisma.record.upsert({
        where: {
          userId_month_year_category_colorMode: {
            userId: record.userId,
            month: month,
            year: year,
            category: record.category,
            colorMode: record.colorMode
          }
        },
        update: {
          initial: record.initial,
          week1: record.week1,
          week2: record.week2,
          week3: record.week3,
          week4: record.week4,
          week5: record.week5,
        },
        create: {
          userId: record.userId,
          month: month,
          year: year,
          category: record.category,
          colorMode: record.colorMode,
          initial: record.initial,
          week1: record.week1,
          week2: record.week2,
          week3: record.week3,
          week4: record.week4,
          week5: record.week5,
        }
      });
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save records" }, { status: 500 });
  }
}
