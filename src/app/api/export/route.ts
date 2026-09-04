import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  try {
    const records = await prisma.record.findMany({
      where: { month, year },
      include: { user: { select: { name: true, username: true } } }
    });

    const exportData = records.map((r: any) => {
      // Calculate usages
      const w1Usage = (r.week1 != null && r.initial != null) ? r.week1 - r.initial : null;
      const w2Usage = (r.week2 != null && r.week1 != null) ? r.week2 - r.week1 : null;
      const w3Usage = (r.week3 != null && r.week2 != null) ? r.week3 - r.week2 : null;
      const w4Usage = (r.week4 != null && r.week3 != null) ? r.week4 - r.week3 : null;
      const w5Usage = (r.week5 != null && r.week4 != null) ? r.week5 - r.week4 : null;
      
      let lastVal = null;
      if (r.week5 != null) lastVal = r.week5;
      else if (r.week4 != null) lastVal = r.week4;
      else if (r.week3 != null) lastVal = r.week3;
      else if (r.week2 != null) lastVal = r.week2;
      else if (r.week1 != null) lastVal = r.week1;

      const totalUsage = (lastVal != null && r.initial != null) ? lastVal - r.initial : 0;

      return {
        "Name": r.user.name,
        "Username": r.user.username,
        "Category": r.category,
        "Color Mode": r.colorMode,
        "Initial (Baseline)": r.initial,
        "W1": r.week1,
        "Total W1": w1Usage,
        "W2": r.week2,
        "Total W2": w2Usage,
        "W3": r.week3,
        "Total W3": w3Usage,
        "W4": r.week4,
        "Total W4": w4Usage,
        "W5": r.week5,
        "Total W5": w5Usage,
        "Total Usage Bulan": totalUsage,
        "Bulan": r.month,
        "Tahun": r.year,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usage Report");

    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="FCMM_Report_${year}_${month}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
