"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown, Users } from "lucide-react";

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
      <div className="page-header">
        <div>
          <h1>Statistik & Analitik</h1>
          <p>Tinjauan performa dan pemakaian mesin fotokopi</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-control py-2 w-full md:w-[140px]">
            <option value="week">Per Minggu</option>
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>
          
          {filter === "week" && (
            <select value={week} onChange={(e) => setWeek(parseInt(e.target.value))} className="form-control py-2 w-full md:w-[140px]">
              {[2, 3, 4, 5].map(w => <option key={w} value={w}>Minggu ke-{w}</option>)}
            </select>
          )}

          {(filter === "month" || filter === "week") && (
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="form-control py-2 w-full md:w-[140px]">
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>
          )}
          
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="form-control py-2 w-full md:w-[140px]">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-[var(--primary-500)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
          <div className="glass-card p-6">
            <div className="flex items-center mb-6">
              <div className="stat-icon-box bg-[var(--danger-500)]/10 text-[var(--danger-500)] mr-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[var(--text-primary)]">Penggunaan Tertinggi</h3>
            </div>
            <div className="space-y-4">
              {topUsers.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">Tidak ada data tersedia.</p>
              ) : (
                topUsers.map((user, idx) => (
                  <div key={user.username} className="flex justify-between items-center pb-3 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--bg-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">{idx + 1}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{user.name}</span>
                    </div>
                    <span className="font-extrabold text-[var(--danger-500)]">{user.totalUsage.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center mb-6">
              <div className="stat-icon-box bg-[var(--success-500)]/10 text-[var(--success-500)] mr-4">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[var(--text-primary)]">Penggunaan Terendah</h3>
            </div>
            <div className="space-y-4">
              {bottomUsers.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">Tidak ada data tersedia.</p>
              ) : (
                bottomUsers.map((user, idx) => (
                  <div key={user.username} className="flex justify-between items-center pb-3 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[var(--bg-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">{idx + 1}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{user.name}</span>
                    </div>
                    <span className="font-extrabold text-[var(--success-500)]">{user.totalUsage.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="md:col-span-2 glass-card p-6">
             <div className="flex items-center mb-6">
                <div className="stat-icon-box bg-[var(--primary-500)]/10 text-[var(--primary-500)] mr-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-[var(--text-primary)]">Semua Pengguna</h3>
             </div>
             <div className="data-table-container">
               <table className="data-table">
                 <thead>
                   <tr>
                     <th>Peringkat</th>
                     <th>Nama Pengguna</th>
                     <th className="text-right">Total Pemakaian</th>
                   </tr>
                 </thead>
                 <tbody>
                   {data.map((user, idx) => (
                     <tr key={user.username}>
                       <td data-label="Peringkat"><span className="font-bold">{idx + 1}</span></td>
                       <td data-label="Nama Pengguna"><span className="font-semibold">{user.name}</span></td>
                       <td data-label="Total Pemakaian" className="md:text-right">
                         <span className="font-extrabold text-[var(--primary-500)]">{user.totalUsage.toLocaleString()}</span>
                       </td>
                     </tr>
                   ))}
                   {data.length === 0 && (
                     <tr><td colSpan={3} className="text-center py-8 text-[var(--text-secondary)]">Tidak ada data.</td></tr>
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
