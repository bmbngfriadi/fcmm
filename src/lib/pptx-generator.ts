import { prisma } from "@/lib/prisma";
import pptxgen from "pptxgenjs";

export async function generatePPTXBuffer(currentMonth: number, currentYear: number): Promise<Buffer> {
  // Fetch all records
  const records = await prisma.record.findMany({
    include: { user: true }
  });
  
  const totalUsers = await prisma.user.count();

  // Helper to calculate total usage for a record
  const calculateUsage = (r: any) => {
    let lastValue = 0;
    if (r.week5 != null) lastValue = r.week5;
    else if (r.week4 != null) lastValue = r.week4;
    else if (r.week3 != null) lastValue = r.week3;
    else if (r.week2 != null) lastValue = r.week2;
    else if (r.week1 != null) lastValue = r.week1;
    else return 0;
    
    if (r.initial == null) return 0;
    const usage = lastValue - r.initial;
    return usage > 0 ? usage : 0;
  };

  const calculateWeekUsage = (r: any, week: number) => {
    const getValue = (w: number) => {
        if (w === 5 && r.week5 != null) return r.week5;
        if (w >= 4 && r.week4 != null) return r.week4;
        if (w >= 3 && r.week3 != null) return r.week3;
        if (w >= 2 && r.week2 != null) return r.week2;
        if (w >= 1 && r.week1 != null) return r.week1;
        if (r.initial != null) return r.initial;
        return 0;
    };
    const current = getValue(week);
    const prev = getValue(week - 1);
    const usage = current - prev;
    return usage > 0 ? usage : 0;
  };

  const monthlyMap: Record<number, { BW: number, COLOR: number }> = {};
  for (let i = 1; i <= 12; i++) monthlyMap[i] = { BW: 0, COLOR: 0 };

  const weeklyMap: Record<number, { PRINT: number, COPY: number, BW: number, COLOR: number }> = {};
  for (let i = 1; i <= 5; i++) weeklyMap[i] = { PRINT: 0, COPY: 0, BW: 0, COLOR: 0 };

  let totalBW = 0, totalColor = 0, totalPrint = 0, totalCopy = 0;
  let totalUsageCurrentMonth = 0;
  
  const userUsageMap: Record<string, { name: string, usage: number }> = {};

  records.forEach(r => {
    const usage = calculateUsage(r);
    
    // Monthly (for selected year)
    if (r.year === currentYear) {
      if (r.colorMode === "BW") monthlyMap[r.month].BW += usage;
      if (r.colorMode === "COLOR") monthlyMap[r.month].COLOR += usage;
    }

    // Weekly (for selected month & year)
    if (r.year === currentYear && r.month === currentMonth) {
      totalUsageCurrentMonth += usage;
      for (let w = 1; w <= 5; w++) {
        const wUsage = calculateWeekUsage(r, w);
        if (r.category === "PRINT") weeklyMap[w].PRINT += wUsage;
        if (r.category === "COPY") weeklyMap[w].COPY += wUsage;
        if (r.colorMode === "BW") weeklyMap[w].BW += wUsage;
        if (r.colorMode === "COLOR") weeklyMap[w].COLOR += wUsage;
      }
    }

    // Distributions (All time)
    if (r.colorMode === "BW") totalBW += usage;
    if (r.colorMode === "COLOR") totalColor += usage;
    if (r.category === "PRINT") totalPrint += usage;
    if (r.category === "COPY") totalCopy += usage;

    // Top Users (Selected year)
    if (r.year === currentYear && r.user) {
        if (!userUsageMap[r.userId]) {
            userUsageMap[r.userId] = { name: r.user.name || "Unknown", usage: 0 };
        }
        userUsageMap[r.userId].usage += usage;
    }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Data for Charts
  const monthlyChartData = [
    { name: "BW", labels: months, values: Object.values(monthlyMap).map(d => d.BW) },
    { name: "COLOR", labels: months, values: Object.values(monthlyMap).map(d => d.COLOR) }
  ];

  const weeklyChartData = [
    { name: "PRINT", labels: ["W1", "W2", "W3", "W4", "W5"], values: Object.values(weeklyMap).map(d => d.PRINT) },
    { name: "COPY", labels: ["W1", "W2", "W3", "W4", "W5"], values: Object.values(weeklyMap).map(d => d.COPY) }
  ];

  let ytdCumulative = 0;
  const ytdValues = Object.values(monthlyMap).map(d => {
    ytdCumulative += (d.BW + d.COLOR);
    return ytdCumulative;
  });
  const ytdChartData = [{ name: "YTD Cumulative", labels: months, values: ytdValues }];

  let mtdCumulative = 0;
  const mtdValues = Object.values(weeklyMap).map(d => {
    mtdCumulative += (d.PRINT + d.COPY);
    return mtdCumulative;
  });
  const mtdChartData = [{ name: "MTD Cumulative", labels: ["W1", "W2", "W3", "W4", "W5"], values: mtdValues }];

  const topUsersData = Object.values(userUsageMap)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);

  const topUsersChartData = [{
    name: "Usage",
    labels: topUsersData.map(u => u.name),
    values: topUsersData.map(u => u.usage)
  }];

  const costBwArr: number[] = [];
  const costColorArr: number[] = [];
  let totalEstimatedCost = 0;

  Object.values(monthlyMap).forEach(d => {
    const bwBillable = d.BW > 2000 ? d.BW - 2000 : 0;
    const costBw = bwBillable * 100;
    const costColor = d.COLOR * 2000;
    costBwArr.push(costBw);
    costColorArr.push(costColor);
    totalEstimatedCost += (costBw + costColor);
  });

  const costChartData = [
    { name: "Cost BW", labels: months, values: costBwArr },
    { name: "Cost Color", labels: months, values: costColorArr }
  ];

  // Initialize PptxGenJS
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "FCMM System";
  pptx.company = "Corporate";
  pptx.title = "Monthly Operational Report";

  // Master Slide
  pptx.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.75, fill: { color: "b52025" } } }, // Dark Red Header
      { image: { x: 0.2, y: 0.1, w: 0.67, h: 0.55, path: "public/logo-sm.png" } }, // Logo
      { text: { text: "FCMM Operational Report", options: { x: 1.2, y: 0.15, w: 4, h: 0.5, color: "FFFFFF", fontSize: 16, bold: true } } },
      { text: { text: `Generated: ${new Date().toLocaleDateString()}`, options: { x: "70%", y: 0.2, w: 2.5, h: 0.5, color: "FFFFFF", fontSize: 10, align: "right" } } },
      { text: { text: "Page", options: { x: 8.5, y: 5.2, w: 0.8, h: 0.3, color: "888888", fontSize: 12, align: "right" } } }
    ],
    slideNumber: { x: 9.4, y: 5.2, w: 0.5, h: 0.3, color: "888888", fontSize: 12, align: "left" }
  });

  // Slide 1: Title
  const slide1 = pptx.addSlide();
  slide1.background = { color: "b52025" }; // Dark Red background
  slide1.addImage({ path: "public/logo-sm.png", x: 3.5, y: 0.2, w: 3, h: 2.47 }); // Fixed aspect ratio
  slide1.addText("Fleet Copier Management System", { x: 1, y: 2.8, w: "80%", h: 1, fontSize: 44, color: "FFFFFF", bold: true, align: "center" });
  slide1.addText(`Operational Analytics Report\nMonth: ${months[currentMonth-1]} ${currentYear}`, { x: 1, y: 4.0, w: "80%", h: 1, fontSize: 24, color: "FFFFFF", align: "center" });

  // Slide 2: Executive Summary
  const slide2 = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slide2.addText("Executive Summary", { x: 0.5, y: 1, w: "90%", h: 0.5, fontSize: 28, bold: true, color: "333333" });
  
  slide2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.5, w: 2.5, h: 1.5, fill: { color: "f1f5f9" }, line: { color: "cbd5e1" } });
  slide2.addText("Total Users", { x: 0.5, y: 2.7, w: 2.5, h: 0.5, fontSize: 14, color: "64748b", align: "center" });
  slide2.addText(totalUsers.toString(), { x: 0.5, y: 3.2, w: 2.5, h: 0.6, fontSize: 32, bold: true, color: "0f172a", align: "center" });

  slide2.addShape(pptx.ShapeType.rect, { x: 3.75, y: 2.5, w: 2.5, h: 1.5, fill: { color: "f1f5f9" }, line: { color: "cbd5e1" } });
  slide2.addText(`Usage (${months[currentMonth-1]})`, { x: 3.75, y: 2.7, w: 2.5, h: 0.5, fontSize: 14, color: "64748b", align: "center" });
  slide2.addText(totalUsageCurrentMonth.toLocaleString(), { x: 3.75, y: 3.2, w: 2.5, h: 0.6, fontSize: 32, bold: true, color: "0f172a", align: "center" });
  
  slide2.addShape(pptx.ShapeType.rect, { x: 7.0, y: 2.5, w: 2.5, h: 1.5, fill: { color: "fef2f2" }, line: { color: "fecaca" } });
  slide2.addText(`Est. Cost (${currentYear})`, { x: 7.0, y: 2.7, w: 2.5, h: 0.5, fontSize: 14, color: "b52025", align: "center" });
  slide2.addText(`Rp ${(totalEstimatedCost / 1000).toLocaleString()}k`, { x: 7.0, y: 3.2, w: 2.5, h: 0.6, fontSize: 28, bold: true, color: "991b1b", align: "center" });

  // Slide 3: Summary Detail (Weekly, Monthly, Yearly)
  const slideSummary = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slideSummary.addText("Usage & Cost Summary", { x: 0.5, y: 1, w: "90%", h: 0.5, fontSize: 28, bold: true, color: "333333" });

  const formatRp = (val: number) => `Rp ${(val).toLocaleString()}`;
  const tableRows: any[][] = [
    [
      { text: "Period", options: { bold: true, fill: "f1f5f9" } }, 
      { text: "Usage (Pages)", options: { bold: true, fill: "f1f5f9" } }, 
      { text: "Estimated Cost", options: { bold: true, fill: "f1f5f9" } }
    ]
  ];

  for(let w=1; w<=5; w++) {
    const wUsage = weeklyMap[w].BW + weeklyMap[w].COLOR;
    const wBwCost = monthlyMap[currentMonth].BW > 0 ? (weeklyMap[w].BW / monthlyMap[currentMonth].BW) * costBwArr[currentMonth-1] : 0;
    const wColorCost = weeklyMap[w].COLOR * 2000;
    const wCost = Math.round(wBwCost + wColorCost);
    if (wUsage > 0 || w === 1) { // Show at least w1
      tableRows.push([`Week ${w} (${months[currentMonth-1]})`, wUsage.toLocaleString(), formatRp(wCost)]);
    }
  }

  const mUsage = monthlyMap[currentMonth].BW + monthlyMap[currentMonth].COLOR;
  const mCost = costBwArr[currentMonth-1] + costColorArr[currentMonth-1];
  tableRows.push([
    { text: `Total Month (${months[currentMonth-1]})`, options: { bold: true, fill: "fffbeb" } },
    { text: mUsage.toLocaleString(), options: { bold: true, fill: "fffbeb" } },
    { text: formatRp(mCost), options: { bold: true, fill: "fffbeb" } }
  ]);

  let yUsage = 0;
  Object.values(monthlyMap).forEach(d => yUsage += d.BW + d.COLOR);
  tableRows.push([
    { text: `Total Year (${currentYear})`, options: { bold: true, fill: "fef2f2" } },
    { text: yUsage.toLocaleString(), options: { bold: true, fill: "fef2f2" } },
    { text: formatRp(totalEstimatedCost), options: { bold: true, fill: "fef2f2" } }
  ]);

  slideSummary.addTable(tableRows, { 
    x: 0.5, y: 1.8, w: 9, 
    colW: [3, 3, 3],
    border: { pt: 1, color: "e2e8f0" },
    fontSize: 14,
    align: "center",
    valign: "middle"
  });

  // Slide 4: Monthly & Weekly Trends
  const slide3 = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slide3.addText("Usage Trends: Monthly & Weekly", { x: 0.5, y: 1, w: "90%", h: 0.5, fontSize: 24, bold: true, color: "333333" });
  
  slide3.addChart(pptx.ChartType.bar, monthlyChartData, {
    x: 0.5, y: 1.8, w: 4.25, h: 3.5,
    title: `Total Usage Per Month (${currentYear})`, showTitle: true,
    barDir: "col", barGrouping: "stacked",
    chartColors: ["64748b", "ef4444"],
    legendPos: "b"
  });

  slide3.addChart(pptx.ChartType.bar, weeklyChartData, {
    x: 5.25, y: 1.8, w: 4.25, h: 3.5,
    title: `Usage Per Week (${months[currentMonth-1]})`, showTitle: true,
    barDir: "col",
    chartColors: ["0284c7", "f59e0b"],
    legendPos: "b"
  });

  // Slide 4: Cumulative YTD & MTD
  const slide4 = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slide4.addText("Cumulative Usage (YTD & MTD)", { x: 0.5, y: 1, w: "90%", h: 0.5, fontSize: 24, bold: true, color: "333333" });
  
  slide4.addChart(pptx.ChartType.area, ytdChartData, {
    x: 0.5, y: 1.8, w: 4.25, h: 3.5,
    title: `YTD Cumulative (${currentYear})`, showTitle: true,
    chartColors: ["ef4444"],

    showLegend: false
  });

  slide4.addChart(pptx.ChartType.area, mtdChartData, {
    x: 5.25, y: 1.8, w: 4.25, h: 3.5,
    title: `MTD Cumulative (${months[currentMonth-1]})`, showTitle: true,
    chartColors: ["22c55e"],

    showLegend: false
  });

  // Slide 5: Distribution (Pie Charts)
  const slide5 = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slide5.addText("Historical Distribution Analysis", { x: 0.5, y: 1, w: "90%", h: 0.5, fontSize: 24, bold: true, color: "333333" });
  
  const pieBWColor = [{ name: "Color vs BW", labels: ["BW", "COLOR"], values: [totalBW, totalColor] }];
  const piePrintCopy = [{ name: "Print vs Copy", labels: ["PRINT", "COPY"], values: [totalPrint, totalCopy] }];

  slide5.addChart(pptx.ChartType.pie, pieBWColor, {
    x: 0.5, y: 1.8, w: 4.25, h: 3.5,
    title: "BW vs Color (All Time)", showTitle: true,
    chartColors: ["64748b", "ef4444"],
    showLegend: true, legendPos: "b",
    dataLabelFormatCode: "0%"
  });

  slide5.addChart(pptx.ChartType.pie, piePrintCopy, {
    x: 5.25, y: 1.8, w: 4.25, h: 3.5,
    title: "Print vs Copy (All Time)", showTitle: true,
    chartColors: ["0284c7", "f59e0b"],
    showLegend: true, legendPos: "b",
    dataLabelFormatCode: "0%"
  });

  // Slide 6: Top Users
  const slide6 = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slide6.addText("Top 5 Users & Departments", { x: 0.5, y: 1, w: "90%", h: 0.5, fontSize: 24, bold: true, color: "333333" });
  
  slide6.addChart(pptx.ChartType.bar, topUsersChartData, {
    x: 0.5, y: 1.8, w: 9, h: 3.5,
    title: `Highest Usage (${currentYear})`, showTitle: true,
    barDir: "bar",
    chartColors: ["f97316"],
    showLegend: false,
    dataLabelPosition: "outEnd"
  });

  // Slide 7: Cost Analysis
  const slide7 = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slide7.addText("Estimated Monthly Cost Analysis", { x: 0.5, y: 1, w: "90%", h: 0.5, fontSize: 24, bold: true, color: "333333" });
  
  slide7.addChart(pptx.ChartType.bar, costChartData, {
    x: 0.5, y: 1.8, w: 9, h: 3.5,
    title: `Monthly Estimated Cost (IDR)`, showTitle: true,
    barDir: "col", barGrouping: "stacked",
    chartColors: ["64748b", "ef4444"],
    legendPos: "b"
  });

  // Generate buffer
  return await pptx.write({ outputType: "nodebuffer" }) as Buffer;
}
