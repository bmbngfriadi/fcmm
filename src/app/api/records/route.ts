import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const targetUserId = searchParams.get("userId");
  
  let records;
  if (session.user.role === "ADMIN" || session.user.role === "LEADER") {
    // For admin and leader, always fetch all users for the massive grid
    records = await prisma.record.findMany({
      where: { month, year },
      include: { user: { select: { id: true, name: true, username: true } } }
    });
  } else {
    records = await prisma.record.findMany({
      where: { month, year, userId: session.user.id },
      include: { user: { select: { id: true, name: true, username: true } } }
    });
  }
  
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, month, year, category, colorMode, week1, week2, week3, week4 } = body;
    
    // Admins can create records for any user, but this simple version uses the current user's ID
    const targetUserId = session.user.role === "ADMIN" && body.userId ? body.userId : session.user.id;

    if (id) {
      // Update existing
      const updated = await prisma.record.update({
        where: { id },
        data: { week1, week2, week3, week4 }
      });
      return NextResponse.json(updated);
    } else {
      // Create new
      const created = await prisma.record.create({
        data: {
          userId: targetUserId,
          month,
          year,
          category,
          colorMode,
          week1,
          week2,
          week3,
          week4
        }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save record" }, { status: 500 });
  }
}
