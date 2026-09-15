"use client";

import { useTheme } from "next-themes";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useState, useEffect } from "react";

interface DashboardData {
  monthlyData: { name: string; BW: number; COLOR: number }[];
  weeklyData: { name: string; PRINT: number; COPY: number }[];
  categoryDistribution: { name: string; value: number }[];
  colorDistribution: { name: string; value: number }[];
  topUsers: { name: string; usage: number }[];
  ytdData: { name: string; cumulative: number; total: number }[];
  mtdData: { name: string; cumulative: number; total: number }[];
  dailyAverages: { name: string; average: number }[];
  costData: { name: string; CostBW: number; CostColor: number; TotalCost: number }[];
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
const PIE_COLORS = {
  BW: '#64748b', // slate
  COLOR: '#ef4444', // red
  PRINT: '#0284c7', // sky
  COPY: '#f59e0b' // amber
};

export function DashboardCharts({ data }: { data: DashboardData }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-[400px] w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-sm border-2 border-zinc-200 dark:border-zinc-800"></div>;

  const textColor = theme === 'dark' ? '#71717a' : '#71717a';
  const gridColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
  const tooltipBg = theme === 'dark' ? '#09090b' : '#ffffff';

  const formatIDR = (value: any) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Monthly and Weekly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">Total Usage Per Month (Current Year)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  itemStyle={{ color: textColor }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Legend iconType="circle" />
                <Bar dataKey="BW" name="Black & White" stackId="a" fill={PIE_COLORS.BW} radius={[0, 0, 4, 4]} animationDuration={1500} />
                <Bar dataKey="COLOR" name="Color" stackId="a" fill={PIE_COLORS.COLOR} radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">Usage Per Week (Current Month)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Legend iconType="circle" />
                <Bar dataKey="PRINT" name="Print" fill={PIE_COLORS.PRINT} radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar dataKey="COPY" name="Copy" fill={PIE_COLORS.COPY} radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Row: YTD and MTD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">Year-To-Date (YTD) Cumulative</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.ytdData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorYtd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  itemStyle={{ color: textColor }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Area type="monotone" dataKey="cumulative" name="YTD Usage" stroke={COLORS[0]} fillOpacity={1} fill="url(#colorYtd)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">Month-To-Date (MTD) Cumulative</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.mtdData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMtd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  itemStyle={{ color: textColor }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Area type="monotone" dataKey="cumulative" name="MTD Usage" stroke={COLORS[3]} fillOpacity={1} fill="url(#colorMtd)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third Row: Pies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">BW vs Color (All Time)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.colorDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {data.colorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Legend iconType="circle" verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">Print vs Copy (All Time)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {data.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Legend iconType="circle" verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fourth Row: Users and Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">Top 5 Users (This Year)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topUsers} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={textColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                <YAxis dataKey="name" type="category" stroke={textColor} fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Bar dataKey="usage" name="Total Usage" radius={[0, 4, 4, 0]} animationDuration={1500}>
                  {data.topUsers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 text-center">Avg Daily Usage Per Dept. (This Month)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyAverages} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={textColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                <YAxis dataKey="name" type="category" stroke={textColor} fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Bar dataKey="average" name="Daily Avg" radius={[0, 4, 4, 0]} animationDuration={1500}>
                  {data.dailyAverages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fifth Row: Estimated Cost */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-2">Estimated Monthly Cost (Rp)</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-xs font-mono uppercase tracking-wider mb-6">BW (Rp 100/lembar, mulai dari lembar ke-2001) & Color (Rp 2.000/lembar dari lembar ke-1)</p>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.costData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value / 1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, borderRadius: '2px', borderWidth: '2px' }}
                itemStyle={{ color: textColor }}
                formatter={(value: any) => formatIDR(value)}
              />
              <Legend iconType="circle" />
              <Bar dataKey="CostBW" name="Cost BW" stackId="a" fill={PIE_COLORS.BW} radius={[0, 0, 4, 4]} animationDuration={1500} />
              <Bar dataKey="CostColor" name="Cost Color" stackId="a" fill={PIE_COLORS.COLOR} radius={[4, 4, 0, 0]} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
