import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filename = url.pathname.split('/').pop();
    
    if (!filename) {
        return new NextResponse("File not found", { status: 404 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    
    if (!fs.existsSync(filePath)) {
        return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    let contentType = "application/octet-stream";
    const lower = filename.toLowerCase();
    if (lower.endsWith(".pdf")) contentType = "application/pdf";
    else if (lower.endsWith(".png")) contentType = "image/png";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lower.endsWith(".gif")) contentType = "image/gif";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
