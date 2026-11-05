"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Presentation, Calendar, CalendarDays, Filter } from "lucide-react";

interface ExportModuleProps {
  currentMonth: number;
  currentYear: number;
}

export function ExportModule({ currentMonth, currentYear }: ExportModuleProps) {
  // Mode: "date" (Rentang Tanggal) or "month" (Per Bulan)
  const [exportMode, setExportMode] = useState<"date" | "month">("date");

  // Format today's date and 1st day of month as YYYY-MM-DD
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultEndDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const defaultStartDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Quick Presets
  const setPreset = (preset: "thisMonth" | "lastMonth" | "thisYear") => {
    const now = new Date();
    if (preset === "thisMonth") {
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === "lastMonth") {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const start = `${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}-01`;
      const end = `${lastDayOfLastMonth.getFullYear()}-${pad(lastDayOfLastMonth.getMonth() + 1)}-${pad(lastDayOfLastMonth.getDate())}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === "thisYear") {
      const start = `${now.getFullYear()}-01-01`;
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Derive month and year for PPTX if in date mode
  const derivedYear = exportMode === "date" && startDate ? parseInt(startDate.slice(0, 4)) : selectedYear;
  const derivedMonth = exportMode === "date" && startDate ? parseInt(startDate.slice(5, 7)) : selectedMonth;

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--primary-500)]"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[var(--primary-500)]" />
            Data Export Module
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Unduh rekap laporan pemakaian mesin dalam format Excel atau PowerPoint
          </p>
        </div>

        {/* Export Mode Toggle */}
        <div className="inline-flex p-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setExportMode("date")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              exportMode === "date"
                ? "bg-[var(--primary-500)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Rentang Tanggal
          </button>
          <button
            type="button"
            onClick={() => setExportMode("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              exportMode === "month"
                ? "bg-[var(--primary-500)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Per Bulan
          </button>
        </div>
      </div>

      <form action="/fcmm/api/export" method="GET" className="space-y-4">
        {/* Hidden inputs to pass mode and derived period */}
        <input type="hidden" name="mode" value={exportMode} />

        {exportMode === "date" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-control w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-control w-full"
                  required
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => setPreset("thisMonth")}
                className="px-2.5 py-1 rounded-md bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-[var(--primary-500)] text-[var(--text-secondary)] hover:text-[var(--primary-500)] transition-colors font-medium"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setPreset("lastMonth")}
                className="px-2.5 py-1 rounded-md bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-[var(--primary-500)] text-[var(--text-secondary)] hover:text-[var(--primary-500)] transition-colors font-medium"
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                onClick={() => setPreset("thisYear")}
                className="px-2.5 py-1 rounded-md bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-[var(--primary-500)] text-[var(--text-secondary)] hover:text-[var(--primary-500)] transition-colors font-medium"
              >
                Tahun Ini
              </button>
            </div>

            {/* Fallback month/year in case PPTX is clicked */}
            <input type="hidden" name="month" value={derivedMonth} />
            <input type="hidden" name="year" value={derivedYear} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Bulan
              </label>
              <select
                name="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="form-control w-full"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Bulan {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Tahun
              </label>
              <select
                name="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="form-control w-full"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Excel dilengkapi <strong>AutoFilter</strong> & baris <strong>TOTAL otomatis</strong> (SUBTOTAL) yang langsung menyesuaikan saat data difilter.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" className="btn-success cursor-pointer">
              <FileSpreadsheet className="w-5 h-5" />
              Generate Excel
            </button>
            <button
              type="submit"
              formAction="/fcmm/api/export-pptx"
              className="btn-warning cursor-pointer"
            >
              <Presentation className="w-5 h-5" />
              Generate PPTX
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

