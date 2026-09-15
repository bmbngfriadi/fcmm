import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generatePPTXBuffer } from "@/lib/pptx-generator";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const currentYear = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const currentMonth = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

  try {
    const pptxBuffer = await generatePPTXBuffer(currentMonth, currentYear);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const filename = `FCMM_Report_${currentYear}_${months[currentMonth-1]}.pptx`;

    return new NextResponse(pptxBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error("PPTX Generation error:", error);
    return NextResponse.json({ error: "Failed to generate PPTX" }, { status: 500 });
  }
}
