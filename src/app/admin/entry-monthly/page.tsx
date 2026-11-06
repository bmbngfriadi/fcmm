"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, CalendarRange, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAlert } from "@/components/AlertProvider";

const CATEGORIES = ["PRINT", "COPY"];
const COLOR_MODES = ["BW", "COLOR"];

const formatCategory = (cat: string) => {
  if (cat === "PRINT") return "Jumlah Print";
  if (cat === "COPY") return "Jumlah Copy";
  if (cat === "SCAN") return "Jumlah Scan";
  return cat;
};

export default function MonthlyDataEntryPage() {
  const { data: session } = useSession();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const pad = (n: number) => String(n).padStart(2, "0");

  // Default dates: 1st day of selected month to last day of selected month
  const getDefaultStartDate = (m: number, y: number) => `${y}-${pad(m)}-01`;
  const getDefaultEndDate = (m: number, y: number) => {
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${pad(m)}-${pad(lastDay)}`;
  };

  const [startDate, setStartDate] = useState(getDefaultStartDate(month, year));
  const [endDate, setEndDate] = useState(getDefaultEndDate(month, year));
  const [activeCategory, setActiveCategory] = useState("PRINT");

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { showAlert } = useAlert();

  // Form data: formData[userId][category][colorMode] = { startMeter: '', endMeter: '' }
  const [formData, setFormData] = useState<Record<string, any>>({});
  // Weekly usage map from weekly input: weeklyUsageMap[userId][category][colorMode] = number
  const [weeklyUsageMap, setWeeklyUsageMap] = useState<Record<string, any>>({});

  const isAdmin = session?.user?.role === "ADMIN";
  const isLeader = session?.user?.role === "LEADER";
  const isReadOnly = isLeader;
  const canSeeAllUsers = isAdmin || isLeader;

  // Sync date inputs when month/year changes if user hasn't typed custom dates
  useEffect(() => {
    setStartDate(getDefaultStartDate(month, year));
    setEndDate(getDefaultEndDate(month, year));
  }, [month, year]);

  useEffect(() => {
    if (canSeeAllUsers) {
      fetch("/fcmm/api/users")
        .then((res) => res.json())
        .then((data) => setUsersList(data))
        .catch(console.error);
    }
  }, [session, canSeeAllUsers]);

  useEffect(() => {
    if (usersList.length > 0 || !canSeeAllUsers) {
      fetchMonthlyRecords();
    }
  }, [month, year, usersList, canSeeAllUsers]);

  const fetchMonthlyRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/fcmm/api/records/monthly?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        const { monthlyRecords, weeklyUsageMap: wMap, savedStartDate, savedEndDate } = data;

        if (savedStartDate) setStartDate(savedStartDate);
        if (savedEndDate) setEndDate(savedEndDate);
        setWeeklyUsageMap(wMap || {});

        const targetUsers = canSeeAllUsers
          ? usersList
          : [{ id: session?.user?.id, name: session?.user?.name, username: (session?.user as any)?.username }];

        const newForm: Record<string, any> = {};
        targetUsers.forEach((u) => {
          newForm[u.id] = {};
          CATEGORIES.forEach((cat) => {
            newForm[u.id][cat] = {
              BW: { startMeter: "", endMeter: "" },
              COLOR: { startMeter: "", endMeter: "" },
            };
          });
        });

        monthlyRecords.forEach((m: any) => {
          if (newForm[m.userId] && newForm[m.userId][m.category]) {
            newForm[m.userId][m.category][m.colorMode] = {
              startMeter: m.startMeter ?? "",
              endMeter: m.endMeter ?? "",
            };
          }
        });

        setFormData(newForm);
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Gagal memuat data bulanan.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (userId: string, category: string, colorMode: string, field: "startMeter" | "endMeter", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [category]: {
          ...prev[userId]?.[category],
          [colorMode]: {
            ...prev[userId]?.[category]?.[colorMode],
            [field]: value === "" ? "" : parseInt(value),
          },
        },
      },
    }));
  };

  const handleResetDates = () => {
    setStartDate(getDefaultStartDate(month, year));
    setEndDate(getDefaultEndDate(month, year));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToSave: any[] = [];
      const targetUsers = canSeeAllUsers ? usersList : [{ id: session?.user?.id }];

      targetUsers.forEach((u) => {
        CATEGORIES.forEach((cat) => {
          COLOR_MODES.forEach((color) => {
            const data = formData[u.id]?.[cat]?.[color];
            if (data) {
              recordsToSave.push({
                userId: u.id,
                category: cat,
                colorMode: color,
                startMeter: data.startMeter === "" ? null : data.startMeter,
                endMeter: data.endMeter === "" ? null : data.endMeter,
              });
            }
          });
        });
      });

      const res = await fetch("/fcmm/api/records/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          startDate,
          endDate,
          records: recordsToSave,
        }),
      });

      if (res.ok) {
        showAlert({ title: "Berhasil", message: "Data meteran bulanan berhasil disimpan!", type: "success" });
      } else {
        showAlert({ title: "Gagal", message: "Gagal menyimpan data bulanan.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Terjadi kesalahan saat menyimpan data.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Helper calculations
  const calculateMonthlyUsage = (start: any, end: any): number | null => {
    if (start === "" || end === "" || start == null || end == null) return null;
    const diff = Number(end) - Number(start);
    return isNaN(diff) ? null : Math.max(0, diff);
  };

  const getWeeklyUsage = (userId: string, category: string, colorMode: string): number | null => {
    const val = weeklyUsageMap[userId]?.[category]?.[colorMode];
    return val != null ? Number(val) : null;
  };

  const calculateGap = (monthlyUsage: number | null, weeklyUsage: number | null): number | null => {
    if (monthlyUsage == null || weeklyUsage == null) return null;
    return monthlyUsage - weeklyUsage;
  };

  // Summary totals for cards
  const targetUsers = canSeeAllUsers
    ? usersList.filter((u) => !u.isHidden)
    : [{ id: session?.user?.id, name: session?.user?.name, username: (session?.user as any)?.username }];

  const totalMonthlyBW = targetUsers.reduce((sum, u) => {
    const usage = calculateMonthlyUsage(
      formData[u.id]?.[activeCategory]?.BW?.startMeter,
      formData[u.id]?.[activeCategory]?.BW?.endMeter
    );
    return sum + (usage || 0);
  }, 0);

  const totalMonthlyColor = targetUsers.reduce((sum, u) => {
    const usage = calculateMonthlyUsage(
      formData[u.id]?.[activeCategory]?.COLOR?.startMeter,
      formData[u.id]?.[activeCategory]?.COLOR?.endMeter
    );
    return sum + (usage || 0);
  }, 0);

  const totalWeeklyBW = targetUsers.reduce((sum, u) => {
    const usage = getWeeklyUsage(u.id, activeCategory, "BW");
    return sum + (usage || 0);
  }, 0);

  const totalWeeklyColor = targetUsers.reduce((sum, u) => {
    const usage = getWeeklyUsage(u.id, activeCategory, "COLOR");
    return sum + (usage || 0);
  }, 0);

  const totalGapBW = totalMonthlyBW - totalWeeklyBW;
  const totalGapColor = totalMonthlyColor - totalWeeklyColor;

  return (
    <div className="space-y-6 pb-12 animate-fade-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-[var(--text-primary)] flex items-center gap-2.5">
            <CalendarRange className="w-8 h-8 text-[var(--primary-500)]" />
            Input Meteran Bulanan (Monthly)
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Input tarikan meter awal & akhir bulanan (contoh: 1 Okt s/d 31 Okt) dan bandingkan selisih (*gap*) dengan tarikan mingguan.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary self-start md:self-auto cursor-pointer flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Simpan Data Bulanan</span>
          </button>
        )}
      </div>

      {/* Filter and Date Range Control Card */}
      <div className="glass-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Bulan Periode
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="form-control w-full"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Bulan {m} ({new Date(2026, m - 1, 1).toLocaleString("id-ID", { month: "long" })})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Tahun
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="form-control w-full"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Dari Tanggal (Meter Awal)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Sampai Tanggal (Meter Akhir)
              </label>
              <button
                type="button"
                onClick={handleResetDates}
                className="text-xs text-[var(--primary-500)] hover:underline flex items-center gap-1 font-semibold"
                title="Reset otomatis ke tanggal 1 s/d akhir bulan"
              >
                <RefreshCw size={11} /> Auto 1-End
              </button>
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control w-full"
            />
          </div>
        </div>
      </div>

      {/* Summary Gap Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card">
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Total Tarikan Bulanan ({formatCategory(activeCategory)})
            </p>
            <div className="flex items-baseline gap-4 mt-2">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block font-semibold">B&W:</span>
                <span className="text-xl font-black text-[var(--text-primary)]">{totalMonthlyBW.toLocaleString()}</span>
              </div>
              <div className="border-l border-[var(--border-color)] pl-4">
                <span className="text-xs text-[var(--primary-500)] block font-semibold">Color:</span>
                <span className="text-xl font-black text-[var(--primary-500)]">{totalMonthlyColor.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="stat-icon-box bg-primary-gradient text-white shadow-sm">
            <CalendarRange className="w-5 h-5" />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Total Tarikan Mingguan ({formatCategory(activeCategory)})
            </p>
            <div className="flex items-baseline gap-4 mt-2">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block font-semibold">B&W:</span>
                <span className="text-xl font-black text-[var(--text-primary)]">{totalWeeklyBW.toLocaleString()}</span>
              </div>
              <div className="border-l border-[var(--border-color)] pl-4">
                <span className="text-xs text-[var(--primary-500)] block font-semibold">Color:</span>
                <span className="text-xl font-black text-[var(--primary-500)]">{totalWeeklyColor.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="stat-icon-box bg-warning-gradient text-white shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Total Selisih (Gap Bulanan vs Mingguan)
            </p>
            <div className="flex items-baseline gap-4 mt-2">
              <div>
                <span className="text-xs text-[var(--text-secondary)] block font-semibold">B&W Gap:</span>
                <span
                  className={`text-xl font-black ${
                    totalGapBW === 0
                      ? "text-emerald-600"
                      : totalGapBW > 0
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {totalGapBW > 0 ? `+${totalGapBW.toLocaleString()}` : totalGapBW.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-[var(--border-color)] pl-4">
                <span className="text-xs text-[var(--primary-500)] block font-semibold">Color Gap:</span>
                <span
                  className={`text-xl font-black ${
                    totalGapColor === 0
                      ? "text-emerald-600"
                      : totalGapColor > 0
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {totalGapColor > 0 ? `+${totalGapColor.toLocaleString()}` : totalGapColor.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`stat-icon-box text-white shadow-sm ${
              totalGapBW === 0 && totalGapColor === 0 ? "bg-success-gradient" : "bg-danger-gradient"
            }`}
          >
            {totalGapBW === 0 && totalGapColor === 0 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs & Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-color)]/50 p-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-3 px-4 mx-1 rounded-xl text-center font-bold text-sm transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-[var(--bg-card)] text-[var(--primary-500)] shadow-sm border border-[var(--border-color)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/50"
              }`}
            >
              {formatCategory(cat)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--primary-500)]" />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-max border-collapse border border-[var(--border-color)] text-sm w-full">
              <thead>
                <tr className="bg-[var(--bg-color)] text-[var(--text-primary)] divide-x divide-[var(--border-color)]">
                  <th rowSpan={2} className="px-3 py-3 text-center font-extrabold border-b border-[var(--border-color)] md:sticky left-0 z-20 bg-[var(--bg-color)]">
                    No
                  </th>
                  <th rowSpan={2} className="px-4 py-3 text-left font-extrabold border-b border-[var(--border-color)] md:sticky left-[42px] z-20 bg-[var(--bg-color)]">
                    Nama Pengguna / Departemen
                  </th>
                  <th rowSpan={2} className="px-3 py-3 text-center font-extrabold border-b border-[var(--border-color)]">
                    User ID
                  </th>

                  {/* Meter Awal */}
                  <th colSpan={2} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] bg-blue-500/10 text-blue-600">
                    Meter Awal ({startDate})
                  </th>

                  {/* Meter Akhir */}
                  <th colSpan={2} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] bg-purple-500/10 text-purple-600">
                    Meter Akhir ({endDate})
                  </th>

                  {/* Pemakaian Bulanan */}
                  <th colSpan={2} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] bg-[var(--primary-500)]/10 text-[var(--primary-500)]">
                    Tarikan Bulanan (Akhir - Awal)
                  </th>

                  {/* Pemakaian Mingguan */}
                  <th colSpan={2} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] bg-amber-500/10 text-amber-700">
                    Tarikan Mingguan (Akumulasi W1-W5)
                  </th>

                  {/* Gap Comparison */}
                  <th colSpan={2} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] bg-rose-500/10 text-rose-600">
                    Selisih / Gap (Bulanan - Mingguan)
                  </th>
                </tr>

                <tr className="bg-[var(--bg-card)] text-[var(--text-secondary)] divide-x divide-[var(--border-color)]">
                  {/* Meter Awal BW/Color */}
                  <td className="p-0 border-b border-[var(--border-color)]">
                    <div className="flex divide-x divide-[var(--border-color)]">
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px]">B&W</div>
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px] text-[var(--primary-500)]">Color</div>
                    </div>
                  </td>
                  {/* Meter Akhir BW/Color */}
                  <td className="p-0 border-b border-[var(--border-color)]">
                    <div className="flex divide-x divide-[var(--border-color)]">
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px]">B&W</div>
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px] text-[var(--primary-500)]">Color</div>
                    </div>
                  </td>
                  {/* Pemakaian Bulanan BW/Color */}
                  <td className="p-0 border-b border-[var(--border-color)]">
                    <div className="flex divide-x divide-[var(--border-color)]">
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px]">B&W</div>
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px] text-[var(--primary-500)]">Color</div>
                    </div>
                  </td>
                  {/* Pemakaian Mingguan BW/Color */}
                  <td className="p-0 border-b border-[var(--border-color)]">
                    <div className="flex divide-x divide-[var(--border-color)]">
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px]">B&W</div>
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px] text-[var(--primary-500)]">Color</div>
                    </div>
                  </td>
                  {/* Gap BW/Color */}
                  <td className="p-0 border-b border-[var(--border-color)]">
                    <div className="flex divide-x divide-[var(--border-color)]">
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px]">B&W Gap</div>
                      <div className="flex-1 px-2 py-1.5 text-center font-semibold text-[11px] text-[var(--primary-500)]">Color Gap</div>
                    </div>
                  </td>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border-color)]">
                {targetUsers.map((u, idx) => {
                  const mBW = calculateMonthlyUsage(
                    formData[u.id]?.[activeCategory]?.BW?.startMeter,
                    formData[u.id]?.[activeCategory]?.BW?.endMeter
                  );
                  const mColor = calculateMonthlyUsage(
                    formData[u.id]?.[activeCategory]?.COLOR?.startMeter,
                    formData[u.id]?.[activeCategory]?.COLOR?.endMeter
                  );

                  const wBW = getWeeklyUsage(u.id, activeCategory, "BW");
                  const wColor = getWeeklyUsage(u.id, activeCategory, "COLOR");

                  const gapBW = calculateGap(mBW, wBW);
                  const gapColor = calculateGap(mColor, wColor);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-[var(--bg-color)] divide-x divide-[var(--border-color)] transition-colors ${
                        u.isHidden ? "opacity-50 bg-[var(--bg-color)]/50" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-center sticky left-0 z-10 bg-[var(--bg-card)] shadow-[2px_0_5px_rgba(0,0,0,0.02)] font-semibold text-xs text-[var(--text-secondary)]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2 font-bold text-[var(--text-primary)] whitespace-nowrap sticky left-[42px] z-10 bg-[var(--bg-card)] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        {u.name} {u.isHidden && <span className="text-xs text-[var(--danger-500)] ml-1 font-normal">(Hidden)</span>}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] text-center text-xs">
                        {u.username}
                      </td>

                      {/* Start Meter Inputs */}
                      <td className="px-1.5 py-1 text-center bg-blue-500/5">
                        <input
                          type="number"
                          value={formData[u.id]?.[activeCategory]?.BW?.startMeter ?? ""}
                          disabled={isReadOnly}
                          onChange={(e) => handleInputChange(u.id, activeCategory, "BW", "startMeter", e.target.value)}
                          placeholder="0"
                          className="w-[85px] px-2 py-1 text-right border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                        />
                      </td>
                      <td className="px-1.5 py-1 text-center bg-blue-500/5">
                        <input
                          type="number"
                          value={formData[u.id]?.[activeCategory]?.COLOR?.startMeter ?? ""}
                          disabled={isReadOnly}
                          onChange={(e) => handleInputChange(u.id, activeCategory, "COLOR", "startMeter", e.target.value)}
                          placeholder="0"
                          className="w-[85px] px-2 py-1 text-right border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-color)] text-[var(--primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                        />
                      </td>

                      {/* End Meter Inputs */}
                      <td className="px-1.5 py-1 text-center bg-purple-500/5">
                        <input
                          type="number"
                          value={formData[u.id]?.[activeCategory]?.BW?.endMeter ?? ""}
                          disabled={isReadOnly}
                          onChange={(e) => handleInputChange(u.id, activeCategory, "BW", "endMeter", e.target.value)}
                          placeholder="0"
                          className="w-[85px] px-2 py-1 text-right border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                        />
                      </td>
                      <td className="px-1.5 py-1 text-center bg-purple-500/5">
                        <input
                          type="number"
                          value={formData[u.id]?.[activeCategory]?.COLOR?.endMeter ?? ""}
                          disabled={isReadOnly}
                          onChange={(e) => handleInputChange(u.id, activeCategory, "COLOR", "endMeter", e.target.value)}
                          placeholder="0"
                          className="w-[85px] px-2 py-1 text-right border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-color)] text-[var(--primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                        />
                      </td>

                      {/* Calculated Monthly Usage */}
                      <td className="px-3 py-2 text-center font-bold text-[var(--text-primary)] bg-[var(--primary-500)]/5">
                        {mBW != null ? mBW.toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-[var(--primary-500)] bg-[var(--primary-500)]/5">
                        {mColor != null ? mColor.toLocaleString() : "-"}
                      </td>

                      {/* Weekly Usage Reference */}
                      <td className="px-3 py-2 text-center font-bold text-amber-800 bg-amber-500/5">
                        {wBW != null ? wBW.toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-amber-700 bg-amber-500/5">
                        {wColor != null ? wColor.toLocaleString() : "-"}
                      </td>

                      {/* Gap / Difference */}
                      <td className="px-3 py-2 text-center bg-rose-500/5">
                        {gapBW == null ? (
                          <span className="text-[var(--text-secondary)] text-xs">-</span>
                        ) : gapBW === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 size={12} /> 0
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              gapBW > 0
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {gapBW > 0 ? `+${gapBW.toLocaleString()}` : gapBW.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center bg-rose-500/5">
                        {gapColor == null ? (
                          <span className="text-[var(--text-secondary)] text-xs">-</span>
                        ) : gapColor === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 size={12} /> 0
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              gapColor > 0
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {gapColor > 0 ? `+${gapColor.toLocaleString()}` : gapColor.toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Row */}
                <tr className="bg-[var(--bg-color)] font-extrabold divide-x divide-[var(--border-color)] border-t-2 border-[var(--border-color)]">
                  <td className="px-3 py-3 text-center md:sticky left-0 z-10 bg-[var(--bg-color)]"></td>
                  <td className="px-4 py-3 md:sticky left-[42px] z-10 bg-[var(--bg-color)] text-right uppercase tracking-wider text-xs">
                    GRAND TOTAL
                  </td>
                  <td className="px-3 py-3 text-center text-xs"></td>

                  {/* Total Start Meters */}
                  <td className="px-3 py-3 text-center text-blue-700 bg-blue-500/10">
                    {targetUsers
                      .reduce((sum, u) => sum + (Number(formData[u.id]?.[activeCategory]?.BW?.startMeter) || 0), 0)
                      .toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center text-blue-700 bg-blue-500/10">
                    {targetUsers
                      .reduce((sum, u) => sum + (Number(formData[u.id]?.[activeCategory]?.COLOR?.startMeter) || 0), 0)
                      .toLocaleString()}
                  </td>

                  {/* Total End Meters */}
                  <td className="px-3 py-3 text-center text-purple-700 bg-purple-500/10">
                    {targetUsers
                      .reduce((sum, u) => sum + (Number(formData[u.id]?.[activeCategory]?.BW?.endMeter) || 0), 0)
                      .toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center text-purple-700 bg-purple-500/10">
                    {targetUsers
                      .reduce((sum, u) => sum + (Number(formData[u.id]?.[activeCategory]?.COLOR?.endMeter) || 0), 0)
                      .toLocaleString()}
                  </td>

                  {/* Total Monthly Usage */}
                  <td className="px-3 py-3 text-center text-[var(--primary-600)] bg-[var(--primary-500)]/10">
                    {totalMonthlyBW.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)] bg-[var(--primary-500)]/10">
                    {totalMonthlyColor.toLocaleString()}
                  </td>

                  {/* Total Weekly Usage */}
                  <td className="px-3 py-3 text-center text-amber-800 bg-amber-500/10">
                    {totalWeeklyBW.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center text-amber-800 bg-amber-500/10">
                    {totalWeeklyColor.toLocaleString()}
                  </td>

                  {/* Total Gap */}
                  <td
                    className={`px-3 py-3 text-center bg-rose-500/10 ${
                      totalGapBW === 0 ? "text-emerald-700" : totalGapBW > 0 ? "text-amber-700" : "text-rose-700"
                    }`}
                  >
                    {totalGapBW > 0 ? `+${totalGapBW.toLocaleString()}` : totalGapBW.toLocaleString()}
                  </td>
                  <td
                    className={`px-3 py-3 text-center bg-rose-500/10 ${
                      totalGapColor === 0 ? "text-emerald-700" : totalGapColor > 0 ? "text-amber-700" : "text-rose-700"
                    }`}
                  >
                    {totalGapColor > 0 ? `+${totalGapColor.toLocaleString()}` : totalGapColor.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
