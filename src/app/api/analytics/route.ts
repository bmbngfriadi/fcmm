import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "month"; // week, month, year
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const week = parseInt(searchParams.get("week") || "1"); // 1, 2, 3, 4, 5

  try {
    let whereClause: any = {};
    if (filter === "month" || filter === "week") {
      whereClause.month = month;
      whereClause.year = year;
    } else if (filter === "year") {
      whereClause.year = year;
    }

    const records = await prisma.record.findMany({
      where: whereClause,
      include: { user: { select: { id: true, name: true, username: true } } }
    });

    const userStats: Record<string, { name: string; username: string; totalUsage: number }> = {};

    records.forEach(r => {
      const uid = r.user.id;
      if (!userStats[uid]) {
        userStats[uid] = { name: r.user.name, username: r.user.username, totalUsage: 0 };
      }

      let usage = 0;
      
      if (filter === "week") {
        if (week === 1 && r.week1 != null && r.initial != null) usage += r.week1 - r.initial;
        else if (week === 2 && r.week2 != null && r.week1 != null) usage += r.week2 - r.week1;
        else if (week === 3 && r.week3 != null && r.week2 != null) usage += r.week3 - r.week2;
        else if (week === 4 && r.week4 != null && r.week3 != null) usage += r.week4 - r.week3;
        else if (week === 5 && r.week5 != null && r.week4 != null) usage += r.week5 - r.week4;
      } else {
        // month or year:
        // mathematically, total usage is the last non-null week minus the initial value
        let lastVal = null;
        if (r.week5 != null) lastVal = r.week5;
        else if (r.week4 != null) lastVal = r.week4;
        else if (r.week3 != null) lastVal = r.week3;
        else if (r.week2 != null) lastVal = r.week2;
        else if (r.week1 != null) lastVal = r.week1;

        if (lastVal != null && r.initial != null) {
          usage += lastVal - r.initial;
        }
      }
      
      userStats[uid].totalUsage += usage;
    });

    const results = Object.values(userStats).sort((a, b) => b.totalUsage - a.totalUsage);

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
