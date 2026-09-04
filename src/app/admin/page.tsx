import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/DashboardCharts";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  // Basic stats
  const totalUsers = await prisma.user.count();
  const totalRecords = await prisma.record.count();

  // Fetch all records for aggregation
  const records = await prisma.record.findMany({
    include: { user: true }
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

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

  // Helper to calculate usage for a specific week
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

  const weeklyMap: Record<number, { PRINT: number, COPY: number }> = {};
  for (let i = 1; i <= 5; i++) weeklyMap[i] = { PRINT: 0, COPY: 0 };

  let totalBW = 0;
  let totalColor = 0;
  let totalPrint = 0;
  let totalCopy = 0;
  
  const userUsageMap: Record<string, { name: string, usage: number }> = {};
  const userCurrentMonthUsageMap: Record<string, { name: string, usage: number }> = {};

  records.forEach(r => {
    const usage = calculateUsage(r);
    
    // Monthly (for current year)
    if (r.year === currentYear) {
      if (r.colorMode === "BW") monthlyMap[r.month].BW += usage;
      if (r.colorMode === "COLOR") monthlyMap[r.month].COLOR += usage;
    }

    // Weekly (for current month & year)
    if (r.year === currentYear && r.month === currentMonth) {
      for (let w = 1; w <= 5; w++) {
        const wUsage = calculateWeekUsage(r, w);
        if (r.category === "PRINT") weeklyMap[w].PRINT += wUsage;
        if (r.category === "COPY") weeklyMap[w].COPY += wUsage;
      }
    }

    // Distributions (All time)
    if (r.colorMode === "BW") totalBW += usage;
    if (r.colorMode === "COLOR") totalColor += usage;
    if (r.category === "PRINT") totalPrint += usage;
    if (r.category === "COPY") totalCopy += usage;

    // Top Users (This year)
    if (r.year === currentYear && r.user) {
        if (!userUsageMap[r.userId]) {
            userUsageMap[r.userId] = { name: r.user.name || "Unknown", usage: 0 };
        }
        userUsageMap[r.userId].usage += usage;
    }

    // Daily Average (This month)
    if (r.year === currentYear && r.month === currentMonth && r.user) {
        if (!userCurrentMonthUsageMap[r.userId]) {
            userCurrentMonthUsageMap[r.userId] = { name: r.user.name || "Unknown", usage: 0 };
        }
        userCurrentMonthUsageMap[r.userId].usage += usage;
    }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = Object.entries(monthlyMap).map(([m, data]) => ({
    name: months[parseInt(m) - 1],
    BW: data.BW,
    COLOR: data.COLOR
  }));

  const weeklyData = Object.entries(weeklyMap).map(([w, data]) => ({
    name: `W${w}`,
    PRINT: data.PRINT,
    COPY: data.COPY
  }));

  // Fallback to empty chart if no data
  const colorDistribution = (totalBW === 0 && totalColor === 0) 
    ? [{ name: "NO DATA", value: 1 }] 
    : [
      { name: "BW", value: totalBW },
      { name: "COLOR", value: totalColor }
    ].filter(d => d.value > 0);

  const categoryDistribution = (totalPrint === 0 && totalCopy === 0)
    ? [{ name: "NO DATA", value: 1 }]
    : [
      { name: "PRINT", value: totalPrint },
      { name: "COPY", value: totalCopy }
    ].filter(d => d.value > 0);

  const topUsers = Object.values(userUsageMap)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);

  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
  const dailyAverages = Object.values(userCurrentMonthUsageMap)
    .map(u => ({
        name: u.name,
        average: parseFloat((u.usage / daysInCurrentMonth).toFixed(2))
    }))
    .sort((a, b) => b.average - a.average);

  let ytdCumulative = 0;
  const ytdData = Object.entries(monthlyMap).map(([m, data]) => {
    const totalForMonth = data.BW + data.COLOR;
    ytdCumulative += totalForMonth;
    return { name: months[parseInt(m) - 1], cumulative: ytdCumulative, total: totalForMonth };
  });

  let mtdCumulative = 0;
  const mtdData = Object.entries(weeklyMap).map(([w, data]) => {
    const totalForWeek = data.PRINT + data.COPY;
    mtdCumulative += totalForWeek;
    return { name: `W${w}`, cumulative: mtdCumulative, total: totalForWeek };
  });

  const costData = Object.entries(monthlyMap).map(([m, data]) => {
    // BW Quota is 2000 per month
    const bwBillable = data.BW > 2000 ? data.BW - 2000 : 0;
    const costBw = bwBillable * 100;
    const costColor = data.COLOR * 2000;
    
    return {
      name: months[parseInt(m) - 1],
      CostBW: costBw,
      CostColor: costColor,
      TotalCost: costBw + costColor
    };
  });

  const dashboardData = {
    monthlyData,
    weeklyData,
    categoryDistribution,
    colorDistribution,
    topUsers,
    ytdData,
    mtdData,
    dailyAverages,
    costData
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary-600"></div>
        
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Dashboard & Analytics</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs font-mono uppercase tracking-wider">
            WELCOME_BACK // {session?.user?.name}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="text-center bg-zinc-100 dark:bg-zinc-950 px-6 py-3 rounded-sm border-2 border-zinc-200 dark:border-zinc-800">
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TOTAL USERS</p>
             <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{totalUsers}</p>
          </div>
          <div className="text-center bg-zinc-100 dark:bg-zinc-950 px-6 py-3 rounded-sm border-2 border-zinc-200 dark:border-zinc-800">
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TOTAL RECORDS</p>
             <p className="text-2xl font-black text-primary-600">{totalRecords}</p>
          </div>
        </div>
      </div>
      
      {/* Analytics Charts */}
      <DashboardCharts data={dashboardData} />

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
        <div className="mb-6">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Data Export Module</h3>
          <div className="h-1 w-12 bg-primary-600 mt-2"></div>
        </div>
        
        <form action="/fcmm-system/api/export" method="GET" className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-4">
          <div className="flex gap-4">
            <select name="month" className="flex-1 px-4 py-3 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 transition-colors font-mono text-sm" defaultValue={currentMonth}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>M{String(m).padStart(2, '0')}</option>
              ))}
            </select>
            <select name="year" className="flex-1 px-4 py-3 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 transition-colors font-mono text-sm" defaultValue={currentYear}>
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <button type="submit" className="w-full md:w-auto px-6 py-3 border-2 border-green-600 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-sm transition-colors uppercase tracking-widest text-center">
              GENERATE EXCEL
            </button>
            <button type="submit" formAction="/fcmm-system/api/export-pptx" className="w-full md:w-auto px-6 py-3 border-2 border-orange-600 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-sm transition-colors uppercase tracking-widest text-center">
              GENERATE PPTX
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
