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
      categories.forEach(cat => {
        const bw = records.find(r => r.userId === u.id && r.category === cat && r.colorMode === "BW");
        const col = records.find(r => r.userId === u.id && r.category === cat && r.colorMode === "COLOR");
        
        const bwUsage = getUsage(bw?.initial, getHighestInput(bw));
        const colUsage = getUsage(col?.initial, getHighestInput(col));
        
        if (bwUsage !== "-") { 
          const val = Number(bwUsage);
          totalUsage += val; 
          totalBW += val; 
          if (cat === "PRINT") totalPrint += val; else totalCopy += val;
        }
        if (colUsage !== "-") { 
          const val = Number(colUsage);
          totalUsage += val; 
          totalColor += val;
          if (cat === "PRINT") totalPrint += val; else totalCopy += val;
        }
      });
      return { ...u, totalUsage };
    });

    userTotals.sort((a, b) => b.totalUsage - a.totalUsage);

    const maxUsage = userTotals.length > 0 ? userTotals[0].totalUsage : 0;
    const topUser = userTotals.length > 0 ? userTotals[0] : null;
    const bottomUser = userTotals.length > 0 ? userTotals[userTotals.length - 1] : null;

    let analyticsHtml = `
      <div style="margin-bottom: 40px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 25px 30px; color: white;">
          <h3 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Performance Analytics</h3>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Key metrics and departmental rankings for this month.</p>
        </div>

        <!-- Highlight Cards -->
        <div style="padding: 30px; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
            <tr>
              <td width="48%" style="background: white; padding: 25px; border-radius: 12px; border-top: 4px solid #ef4444; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center;">
                <div style="display: inline-block; background-color: #fef2f2; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; font-size: 24px; margin-bottom: 15px;">🔥</div>
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Highest Usage</p>
                <p style="margin: 10px 0 5px 0; font-size: 24px; font-weight: 900; color: #0f172a;">${topUser?.name || '-'}</p>
                <p style="margin: 0; font-size: 15px; color: #ef4444; font-weight: 600;">${topUser?.totalUsage.toLocaleString() || 0} pages</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background: white; padding: 25px; border-radius: 12px; border-top: 4px solid #10b981; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center;">
                <div style="display: inline-block; background-color: #ecfdf5; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; font-size: 24px; margin-bottom: 15px;">🌱</div>
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Lowest Usage</p>
                <p style="margin: 10px 0 5px 0; font-size: 24px; font-weight: 900; color: #0f172a;">${bottomUser?.name || '-'}</p>
                <p style="margin: 0; font-size: 15px; color: #10b981; font-weight: 600;">${bottomUser?.totalUsage.toLocaleString() || 0} pages</p>
              </td>
            </tr>
          </table>

          <!-- Charts Section -->
          <div style="background: white; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <h4 style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Usage Distribution</h4>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" align="center">
                  <p style="margin: 0 0 10px 0; font-weight: 600; color: #475569;">Color vs B&W</p>
                  <img src="https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({ type: 'doughnut', data: { labels: ['B&W', 'Color'], datasets: [{ data: [totalBW, totalColor], backgroundColor: ['#64748b', '#ef4444'] }] }, options: { plugins: { datalabels: { color: '#fff', font: { weight: 'bold' } }, legend: { position: 'bottom' } } } }))}&w=250&h=250" alt="BW vs Color" width="220" style="max-width: 100%; border: none;" />
                </td>
                <td width="50%" align="center">
                  <p style="margin: 0 0 10px 0; font-weight: 600; color: #475569;">Print vs Copy</p>
                  <img src="https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({ type: 'doughnut', data: { labels: ['Print', 'Copy'], datasets: [{ data: [totalPrint, totalCopy], backgroundColor: ['#0284c7', '#f59e0b'] }] }, options: { plugins: { datalabels: { color: '#fff', font: { weight: 'bold' } }, legend: { position: 'bottom' } } } }))}&w=250&h=250" alt="Print vs Copy" width="220" style="max-width: 100%; border: none;" />
                </td>
              </tr>
            </table>
          </div>

          <!-- Rankings -->
          <div style="background: white; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h4 style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Department Leaderboard</h4>
            
            ${userTotals.map((u, i) => {
              const percentage = maxUsage > 0 ? (u.totalUsage / maxUsage) * 100 : 0;
              let barColor = 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)'; // default orange
              let medal = `<span style="display: inline-block; width: 24px; color: #94a3b8; font-weight: bold;">#${i+1}</span>`;
              
              if (i === 0) {
                barColor = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
                medal = '<span style="display: inline-block; width: 24px; font-size: 18px;">🏆</span>';
              } else if (i === 1) {
                barColor = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
                medal = '<span style="display: inline-block; width: 24px; font-size: 18px;">🥈</span>';
              } else if (i === 2) {
                barColor = 'linear-gradient(90deg, #eab308 0%, #ca8a04 100%)';
                medal = '<span style="display: inline-block; width: 24px; font-size: 18px;">🥉</span>';
              } else if (i === userTotals.length - 1) {
                barColor = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
              }

              return `
                <div style="margin-bottom: 18px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td align="left" style="font-size: 15px; color: #334155; font-weight: 600;">
                        ${medal} <span style="margin-left: 8px;">${u.name}</span>
                      </td>
                      <td align="right" style="font-size: 15px; font-weight: 700; color: #0f172a;">
                        ${u.totalUsage.toLocaleString()} <span style="font-size: 12px; color: #94a3b8; font-weight: normal;">pages</span>
                      </td>
                    </tr>
                  </table>
                  <div style="width: 100%; background-color: #f1f5f9; border-radius: 8px; height: 10px; overflow: hidden;">
                    <div style="width: ${percentage}%; background: ${barColor}; height: 100%; border-radius: 8px; animation: expandWidth 1.5s ease-out forwards;"></div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    let reportHtml = "";

    for (const cat of categories) {
      reportHtml += `
        <div style="margin-top: 40px; margin-bottom: 20px;">
          <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 15px; display: flex; align-items: center;">
            <span style="background-color: #ea580c; color: white; padding: 4px 10px; border-radius: 6px; font-size: 14px; margin-right: 10px;">${cat}</span> 
            Usage Breakdown
          </h3>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; text-align: center; font-size: 12px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white;">
              <thead style="background-color: #f8fafc; color: #475569; font-weight: 600;">
                <tr>
                  <th rowspan="2" style="text-align: left; border-bottom: 2px solid #e2e8f0; padding-left: 15px;">Username</th>
                  <th colspan="2" style="border-bottom: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;">Initial</th>
                  <th colspan="2" style="border-bottom: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;">W1</th>
                  <th colspan="2" style="border-bottom: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;">W2</th>
                  <th colspan="2" style="border-bottom: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;">W3</th>
                  <th colspan="2" style="border-bottom: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;">W4</th>
                  <th colspan="2" style="border-bottom: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0;">W5</th>
                  <th colspan="2" style="border-bottom: 2px solid #fdba74; border-left: 1px solid #e2e8f0; background-color: #fff7ed; color: #c2410c;">Monthly Total</th>
                </tr>
                <tr style="font-size: 11px; color: #64748b;">
                  <th style="border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">BW</th><th style="border-bottom: 2px solid #e2e8f0;">COL</th>
                  <th style="border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">BW</th><th style="border-bottom: 2px solid #e2e8f0;">COL</th>
                  <th style="border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">BW</th><th style="border-bottom: 2px solid #e2e8f0;">COL</th>
                  <th style="border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">BW</th><th style="border-bottom: 2px solid #e2e8f0;">COL</th>
                  <th style="border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">BW</th><th style="border-bottom: 2px solid #e2e8f0;">COL</th>
                  <th style="border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">BW</th><th style="border-bottom: 2px solid #e2e8f0;">COL</th>
                  <th style="border-bottom: 2px solid #fdba74; border-left: 1px solid #e2e8f0; background-color: #fff7ed;">BW</th><th style="border-bottom: 2px solid #fdba74; background-color: #fff7ed;">COL</th>
                </tr>
              </thead>
              <tbody>
      `;

      let totalMonthlyBW = 0;
      let totalMonthlyCol = 0;

      for (let i = 0; i < allUsers.length; i++) {
        const u = allUsers[i];
        const bw = records.find(r => r.userId === u.id && r.category === cat && r.colorMode === "BW");
        const col = records.find(r => r.userId === u.id && r.category === cat && r.colorMode === "COLOR");
        
        const bwTotal = getUsage(bw?.initial, getHighestInput(bw));
        const colTotal = getUsage(col?.initial, getHighestInput(col));

        if (bwTotal !== "-") totalMonthlyBW += Number(bwTotal);
        if (colTotal !== "-") totalMonthlyCol += Number(colTotal);

        const rowStyle = `border-bottom: 1px solid #f1f5f9; color: #334155; ${i % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #fcfcfc;'}`;

        reportHtml += `
          <tr>
            <td style="${rowStyle} font-weight: 600; text-align: left; padding-left: 15px; white-space: nowrap;">${u.name}</td>
            
            <td style="${rowStyle} border-left: 1px solid #f1f5f9; color: #94a3b8;">${bw?.initial ?? "-"}</td>
            <td style="${rowStyle} color: #94a3b8;">${col?.initial ?? "-"}</td>

            <td style="${rowStyle} border-left: 1px solid #f1f5f9;">${getUsage(bw?.initial, bw?.week1)}</td>
            <td style="${rowStyle}">${getUsage(col?.initial, col?.week1)}</td>

            <td style="${rowStyle} border-left: 1px solid #f1f5f9;">${getWeekUsage(bw?.week1 ?? bw?.initial, bw?.week2)}</td>
            <td style="${rowStyle}">${getWeekUsage(col?.week1 ?? col?.initial, col?.week2)}</td>

            <td style="${rowStyle} border-left: 1px solid #f1f5f9;">${getWeekUsage(bw?.week2 ?? bw?.week1 ?? bw?.initial, bw?.week3)}</td>
            <td style="${rowStyle}">${getWeekUsage(col?.week2 ?? col?.week1 ?? col?.initial, col?.week3)}</td>

            <td style="${rowStyle} border-left: 1px solid #f1f5f9;">${getWeekUsage(bw?.week3 ?? bw?.week2 ?? bw?.week1 ?? bw?.initial, bw?.week4)}</td>
            <td style="${rowStyle}">${getWeekUsage(col?.week3 ?? col?.week2 ?? col?.week1 ?? col?.initial, col?.week4)}</td>

            <td style="${rowStyle} border-left: 1px solid #f1f5f9;">${getWeekUsage(bw?.week4 ?? bw?.week3 ?? bw?.week2 ?? bw?.week1 ?? bw?.initial, bw?.week5)}</td>
            <td style="${rowStyle}">${getWeekUsage(col?.week4 ?? col?.week3 ?? col?.week2 ?? col?.week1 ?? col?.initial, col?.week5)}</td>

            <td style="${rowStyle} border-left: 1px solid #fed7aa; font-weight: 700; color: #c2410c; background-color: #fff7ed;">${bwTotal}</td>
            <td style="${rowStyle} font-weight: 700; color: #c2410c; background-color: #fff7ed;">${colTotal}</td>
          </tr>
        `;
      }

      // Add Grandtotal Row
      reportHtml += `
            <tr style="background-color: #ea580c; color: white; font-weight: bold; font-size: 13px;">
              <td colspan="13" style="text-align: right; padding: 12px 15px; text-transform: uppercase;">Total Usage ${cat}</td>
              <td colspan="2" style="padding: 12px 15px; font-size: 15px;">${(totalMonthlyBW + totalMonthlyCol).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
      `;
    }

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
          <style>
            @keyframes expandWidth {
              0% { width: 0%; opacity: 0; }
              100% { opacity: 1; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f8fafc;">
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #ea580c; font-size: 28px; margin: 0 0 10px 0;">FCMM Machine Usage Report</h2>
              <p style="color: #64748b; font-size: 16px; margin: 0;">Period: <strong>Month ${month}, ${year}</strong></p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${manager.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">Here is the executive summary and detailed breakdown of machine usage across all active departments/users.</p>
            
            ${analyticsHtml}
            
            ${reportHtml}
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automatically generated email from the FCMM System.</p>
              <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 0 0;">&copy; ${year} FCMM System. All rights reserved.</p>
            </div>
          </div>
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
