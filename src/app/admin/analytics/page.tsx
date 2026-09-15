"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

export default function AnalyticsPage() {
  const [filter, setFilter] = useState("month");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(2);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [filter, month, year, week]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await fetch(`/fcmm/api/analytics?filter=${filter}&month=${month}&year=${year}&week=${week}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  };

  const topUsers = [...data].slice(0, 5);
  const bottomUsers = [...data].filter(u => u.totalUsage > 0).reverse().slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-sm gap-4 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary-600"></div>
        
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Analytics</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono uppercase tracking-wider">COMPARE_USAGE // ALL_USERS</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="flex-1 md:flex-none px-4 py-3 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 font-mono text-sm uppercase transition-colors">
            <option value="week">By Week</option>
            <option value="month">By Month</option>
            <option value="year">By Year</option>
          </select>
          
          {filter === "week" && (
            <select value={week} onChange={(e) => setWeek(parseInt(e.target.value))} className="flex-1 md:flex-none px-4 py-3 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 font-mono text-sm uppercase transition-colors">
              {[2, 3, 4, 5].map(w => <option key={w} value={w}>W{String(w).padStart(2, '0')}</option>)}
            </select>
          )}

          {(filter === "month" || filter === "week") && (
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="flex-1 md:flex-none px-4 py-3 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 font-mono text-sm uppercase transition-colors">
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>M{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          )}
          
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="flex-1 md:flex-none px-4 py-3 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 font-mono text-sm uppercase transition-colors">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 border-2 border-red-500 flex items-center justify-center mr-4">
                <TrendingUp className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Top Usage Users</h3>
            </div>
            <div className="space-y-2">
              {topUsers.length === 0 ? (
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">No data available.</p>
              ) : (
                topUsers.map((user, idx) => (
                  <div key={user.username} className="flex justify-between items-center p-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center">
                      <span className="w-6 text-zinc-400 font-mono text-xs">{idx + 1}.</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">{user.name}</span>
                    </div>
                    <span className="font-black text-primary-600">{user.totalUsage.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 border-2 border-green-500 flex items-center justify-center mr-4">
                <TrendingDown className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Least Usage Users</h3>
            </div>
            <div className="space-y-2">
              {bottomUsers.length === 0 ? (
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">No data available.</p>
              ) : (
                bottomUsers.map((user, idx) => (
                  <div key={user.username} className="flex justify-between items-center p-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center">
                      <span className="w-6 text-zinc-400 font-mono text-xs">{idx + 1}.</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">{user.name}</span>
                    </div>
                    <span className="font-black text-green-600">{user.totalUsage.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative">
             <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
             <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-6">All Users Ranking</h3>
             <div className="overflow-x-auto border-2 border-zinc-200 dark:border-zinc-800">
               <table className="min-w-full divide-y-2 divide-zinc-200 dark:divide-zinc-800">
                 <thead className="bg-zinc-100 dark:bg-zinc-950">
                   <tr>
                     <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rank</th>
                     <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">User Name</th>
                     <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Usage</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                   {data.map((user, idx) => (
                     <tr key={user.username} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                       <td className="px-6 py-4 text-xs text-zinc-500 font-mono">{idx + 1}</td>
                       <td className="px-6 py-4 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{user.name}</td>
                       <td className="px-6 py-4 text-sm text-right font-black text-primary-600">{user.totalUsage.toLocaleString()}</td>
                     </tr>
                   ))}
                   {data.length === 0 && (
                     <tr><td colSpan={3} className="text-center py-8 text-zinc-500 font-mono text-xs uppercase tracking-widest">NO_DATA_FOUND</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
