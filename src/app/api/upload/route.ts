import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const month = data.get("month") as string;
    const year = data.get("year") as string;
    const category = data.get("category") as any;
    const week = data.get("week") as string;

    if (!file || !week) {
      return NextResponse.json({ error: "Missing file or week" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    // Use a unique filename
    const ext = path.extname(file.name);
    const filename = `${category}-${week}-${month}-${year}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);
    const fileUrl = `/fcmm-system/uploads/${filename}`;

    // Save to DB
    const reportFile = await prisma.reportFile.upsert({
      where: {
        month_year_category_week: {
          month: parseInt(month),
          year: parseInt(year),
          category: category,
          week: week,
        }
      },
      update: {
        fileUrl: fileUrl,
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        category: category,
        week: week,
        fileUrl: fileUrl,
      },
    });

    return NextResponse.json({ success: true, fileUrl: reportFile.fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const category = searchParams.get("category");

  if (!month || !year || !category) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const reportFiles = await prisma.reportFile.findMany({
      where: {
        month: parseInt(month),
        year: parseInt(year),
        category: category as any,
      }
    });

    const filesByWeek: Record<string, string> = {};
    reportFiles.forEach(file => {
      filesByWeek[file.week] = file.fileUrl;
    });

    return NextResponse.json({ files: filesByWeek });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
