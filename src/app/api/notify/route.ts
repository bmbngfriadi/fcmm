import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generatePPTXBuffer } from "@/lib/pptx-generator";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { userIds, month, year } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "No users selected" }, { status: 400 });
    }

    // Recipients (Managers/Supervisors selected in UI)
    const recipients = await prisma.user.findMany({
      where: { id: { in: userIds } }
    });

    // All active users for the report
    const allUsers = await prisma.user.findMany({
      where: { isHidden: false },
      orderBy: { name: 'asc' }
    });

    // All records for the month
    const records = await prisma.record.findMany({
      where: {
        month: month,
        year: year
      }
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const getUsage = (initial: number | null | undefined, w: number | null | undefined) => {
      if (initial == null || w == null) return "-";
      return w - initial;
    };
    
    const getWeekUsage = (prev: number | null | undefined, curr: number | null | undefined) => {
      if (prev == null || curr == null) return "-";
      return curr - prev;
    };

    const getHighestInput = (r: any) => {
      if (!r) return null;
      if (r.week5 != null) return r.week5;
      if (r.week4 != null) return r.week4;
      if (r.week3 != null) return r.week3;
      if (r.week2 != null) return r.week2;
      if (r.week1 != null) return r.week1;
      return null;
    };

    const categories = ["PRINT", "COPY"];
    
    let totalBW = 0, totalColor = 0, totalPrint = 0, totalCopy = 0;

    // Calculate Analytics
    let userTotals = allUsers.map(u => {
      let totalUsage = 0;
      let printUsage = 0;
      let copyUsage = 0;
      categories.forEach(cat => {
        const bw = records.find(r => r.userId === u.id && r.category === cat && r.colorMode === "BW");
        const col = records.find(r => r.userId === u.id && r.category === cat && r.colorMode === "COLOR");
        
        const bwUsage = getUsage(bw?.initial, getHighestInput(bw));
        const colUsage = getUsage(col?.initial, getHighestInput(col));
        
        if (bwUsage !== "-") { 
          const val = Number(bwUsage);
          totalUsage += val; 
          totalBW += val; 
          if (cat === "PRINT") { totalPrint += val; printUsage += val; } else { totalCopy += val; copyUsage += val; }
        }
        if (colUsage !== "-") { 
          const val = Number(colUsage);
          totalUsage += val; 
          totalColor += val;
          if (cat === "PRINT") { totalPrint += val; printUsage += val; } else { totalCopy += val; copyUsage += val; }
        }
      });
      return { ...u, totalUsage, printUsage, copyUsage };
    });

    userTotals.sort((a, b) => b.totalUsage - a.totalUsage);

    const maxUsage = userTotals.length > 0 ? userTotals[0].totalUsage : 0;
    const topUser = userTotals.length > 0 ? userTotals[0] : null;
    const bottomUser = userTotals.length > 0 ? userTotals[userTotals.length - 1] : null;

    const activeUsersCount = userTotals.length;
    const overallTotal = totalBW + totalColor;
    const colorRatio = overallTotal > 0 ? ((totalColor / overallTotal) * 100).toFixed(1) : '0';
    const bwRatio = overallTotal > 0 ? ((totalBW / overallTotal) * 100).toFixed(1) : '0';

    const top3Html = userTotals.slice(0, 3).map((u, i) => `
      <tr>
        <td style="border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 13px; padding: 6px 0;">${i+1}. ${u.name}</td>
        <td align="right" style="border-bottom: 1px solid #f1f5f9; padding: 6px 0;">
          <span style="color: #0f172a; font-size: 12px; font-weight: bold;">${u.totalUsage.toLocaleString()}</span>
        </td>
      </tr>
    `).join('');

    const detailUsersHtml = userTotals.slice(0, 5).map(u => `
      <tr>
        <td style="border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 13px; padding: 8px 0;">${u.name}</td>
        <td align="right" style="border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; padding: 8px 0;">${u.printUsage.toLocaleString()}</td>
        <td align="right" style="border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; padding: 8px 0;">${u.copyUsage.toLocaleString()}</td>
      </tr>
    `).join('');

    let sentCount = 0;

    // Generate PPTX
    const pptxBuffer = await generatePPTXBuffer(month, year);
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const filename = `FCMM_Report_${year}_${monthsName[month-1]}.pptx`;

    for (const manager of recipients) {
      if (!manager.email) continue;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <center style="width: 100%; background-color: #f8fafc;">
            <!-- Outlook-safe max-width centering -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-top: 40px; margin-bottom: 40px; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 0;">
                  
                  <!-- Header -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="background-color: #b52025; padding: 30px 20px; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">FCMM System</h1>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Monthly Operational Report Summary</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Body -->
                  <table border="0" cellpadding="30" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0;">Halo <strong>${manager.name}</strong>,</p>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Laporan operasional bulanan FCMM telah berhasil digenerate oleh sistem. Laporan lengkap (PPTX) telah dilampirkan pada email ini. Berikut adalah rincian summary penggunaan mesin:</p>
                        
                        <!-- Grid Summary -->
                        <table width="100%" cellpadding="15" cellspacing="0" style="margin: 25px 0; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                          <tr>
                            <td width="50%" style="border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Periode</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">${monthsName[month-1]} ${year}</p>
                            </td>
                            <td width="50%" style="border-bottom: 1px solid #e2e8f0;">
                              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Highest Usage</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #b52025;">${topUser?.name || '-'}</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="border-right: 1px solid #e2e8f0;">
                              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total BW</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">${totalBW.toLocaleString()} pages</p>
                            </td>
                            <td width="50%">
                              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Color</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">${totalColor.toLocaleString()} pages</p>
                            </td>
                          </tr>
                        </table>

                        <!-- List section -->
                        <h3 style="font-size: 16px; color: #0f172a; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Ringkasan Kategori</h3>
                        
                        <table width="100%" cellpadding="12" cellspacing="0">
                          <tr>
                            <td style="border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 14px;">Print Usage</td>
                            <td align="right" style="border-bottom: 1px solid #f1f5f9;">
                              <span style="background-color: #ecfdf5; color: #10b981; padding: 4px 10px; font-size: 12px; font-weight: bold;">${totalPrint.toLocaleString()} pages</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 14px;">Copy Usage</td>
                            <td align="right" style="border-bottom: 1px solid #f1f5f9;">
                              <span style="background-color: #ecfdf5; color: #10b981; padding: 4px 10px; font-size: 12px; font-weight: bold;">${totalCopy.toLocaleString()} pages</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 14px;">Total Keseluruhan</td>
                            <td align="right" style="border-bottom: 1px solid #f1f5f9;">
                              <span style="background-color: #fef2f2; color: #ef4444; padding: 4px 10px; font-size: 12px; font-weight: bold;">${(totalBW + totalColor).toLocaleString()} pages</span>
                            </td>
                          </tr>
                        </table>

                        <!-- Additional Insight Summary -->
                        <table width="100%" cellpadding="15" cellspacing="0" style="margin: 25px 0; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                          <tr>
                            <td width="50%" style="border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;" valign="top">
                              <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Top 3 Highest Users</p>
                              <table width="100%" cellpadding="0" cellspacing="0">
                                ${top3Html}
                              </table>
                            </td>
                            <td width="50%" style="border-bottom: 1px solid #e2e8f0;" valign="top">
                              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Lowest Usage</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #10b981;">${bottomUser?.name || '-'}</p>
                              <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${bottomUser?.totalUsage.toLocaleString() || '0'} pages</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="border-right: 1px solid #e2e8f0;" valign="top">
                              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Color vs BW Ratio</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">${colorRatio}% Color / ${bwRatio}% BW</p>
                            </td>
                            <td width="50%" valign="top">
                              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Active Depts / Users</p>
                              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">${activeUsersCount} Users</p>
                            </td>
                          </tr>
                        </table>

                        <!-- Detail Category Section -->
                        <h3 style="font-size: 16px; color: #0f172a; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Detail Print vs Copy (Top 5)</h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: bold; padding: 8px 0;">User</td>
                            <td align="right" style="border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: bold; padding: 8px 0;">Print</td>
                            <td align="right" style="border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: bold; padding: 8px 0;">Copy</td>
                          </tr>
                          ${detailUsersHtml}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <table border="0" cellpadding="20" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sistem Notifikasi Otomatis &bull; FCMM System</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">&copy; ${year} FCMM. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
          </center>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: manager.email,
        subject: `[FCMM] Analytics & Global Usage Report - Month ${month}/${year}`,
        html: emailHtml,
        attachments: [
          {
            filename: filename,
            content: pptxBuffer
          }
        ]
      });

      sentCount++;
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error: any) {
    console.error("Notify error:", error);
    return NextResponse.json({ error: "Failed to send notifications", details: error.message }, { status: 500 });
  }
}
