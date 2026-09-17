import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/DashboardCharts";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  // Basic stats
  const totalUsers = await prisma.user.count();
  const totalRecords = await prisma.record.count();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Fetch only current year records for aggregation to prevent OOM on VPS
  const records = await prisma.record.findMany({
    where: { year: currentYear },
    include: { user: true }
  });

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
    <div className="space-y-6 pb-12 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-[var(--text-primary)]">Dashboard & Analytics</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Welcome back, <span className="font-bold">{session?.user?.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="stat-card">
          <div>
            <p className="text-sm font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-black text-[var(--text-primary)]">{totalUsers}</p>
          </div>
          <div className="stat-icon-box bg-primary-gradient shadow-[0_8px_16px_rgba(181,32,37,0.3)] text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="text-sm font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Total Records</p>
            <p className="text-3xl font-black text-[var(--text-primary)]">{totalRecords}</p>
          </div>
          <div className="stat-icon-box bg-warning-gradient shadow-[0_8px_16px_rgba(245,158,11,0.3)] text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
        </div>
      </div>
      
      {/* Analytics Charts */}
      <DashboardCharts data={dashboardData} />

      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--primary-500)]"></div>
        <div className="mb-6">
          <h3 className="text-xl font-extrabold text-[var(--text-primary)]">Data Export Module</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Unduh rekap laporan dalam format Excel atau PowerPoint</p>
        </div>
        
        <form action="/fcmm/api/export" method="GET" className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <select name="month" className="form-control w-full" defaultValue={currentMonth}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>
            <select name="year" className="form-control w-full" defaultValue={currentYear}>
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button type="submit" className="btn-primary !bg-[#10b981] hover:!bg-[#059669] !shadow-[0_4px_14px_rgba(16,185,129,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M14.5 12 12 14.5l-2.5-2.5"/><path d="M12 14.5v-7"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/></svg>
              Generate Excel
            </button>
            <button type="submit" formAction="/fcmm/api/export-pptx" className="btn-primary !bg-[#f59e0b] hover:!bg-[#d97706] !shadow-[0_4px_14px_rgba(245,158,11,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>
              Generate PPTX
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
