import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { isHidden } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isHidden }
    });

    return NextResponse.json({ success: true, isHidden: updatedUser.isHidden });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update hidden status" }, { status: 500 });
  }
}
