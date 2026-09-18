"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, UploadCloud, FileText, X, Send, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAlert } from "@/components/AlertProvider";

const CATEGORIES = ["PRINT", "COPY"];
const COLOR_MODES = ["BW", "COLOR"];

const formatCategory = (cat: string) => {
  if (cat === "PRINT") return "Jumlah Print";
  if (cat === "COPY") return "Jumlah Copy";
  if (cat === "SCAN") return "Jumlah Scan";
  return cat;
}

export default function DataEntryPage() {
  const { data: session } = useSession();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeCategory, setActiveCategory] = useState("PRINT");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [togglingHide, setTogglingHide] = useState<string | null>(null);
  
  const { showAlert } = useAlert();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [referenceFiles, setReferenceFiles] = useState<Record<string, string>>({});
  const [selectedWeek, setSelectedWeek] = useState<string>("W1");
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({});

  const isAdmin = session?.user?.role === "ADMIN";
  const isLeader = session?.user?.role === "LEADER";
  const isReadOnly = isLeader;
  const canSeeAllUsers = isAdmin || isLeader;

  useEffect(() => {
    if (canSeeAllUsers) {
      fetch("/fcmm/api/users").then(res => res.json()).then(data => {
        setUsersList(data);
      });
    }
  }, [session, canSeeAllUsers]);

  useEffect(() => {
    if (usersList.length > 0 || !canSeeAllUsers) {
      fetchRecords();
      fetchReferenceFile();
    }
  }, [month, year, activeCategory, usersList, canSeeAllUsers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showUploadModal) setShowUploadModal(false);
        if (showViewModal) setShowViewModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUploadModal, showViewModal]);

  const fetchReferenceFile = async () => {
    try {
      const res = await fetch(`/fcmm/api/upload?month=${month}&year=${year}&category=${activeCategory}`);
      if (res.ok) {
        const data = await res.json();
        setReferenceFiles(data.files || {});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("month", month.toString());
    formData.append("year", year.toString());
    formData.append("category", activeCategory);
    formData.append("week", selectedWeek);

    try {
      const res = await fetch("/fcmm/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setReferenceFiles(prev => ({...prev, [selectedWeek]: data.fileUrl}));
        setShowUploadModal(false);
        setFileToUpload(null);
        showAlert({ title: "Berhasil", message: "File berhasil diunggah!", type: "success" });
      } else {
        showAlert({ title: "Gagal", message: "Gagal mengunggah file.", type: "error" });
      }
    } catch (error) {
      showAlert({ title: "Error", message: "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    const res = await fetch(`/fcmm/api/records?month=${month}&year=${year}`);
    if (res.ok) {
      const dbRecords = await res.json();
      const newForm: Record<string, any> = {};
      const targetUsers = canSeeAllUsers ? usersList : [{ id: session?.user?.id, name: session?.user?.name, username: (session?.user as any)?.username }];
      
      targetUsers.forEach(u => {
        newForm[u.id] = {};
        CATEGORIES.forEach(cat => {
          newForm[u.id][cat] = {
            BW: { initial: "", week1: "", week2: "", week3: "", week4: "", week5: "" },
            COLOR: { initial: "", week1: "", week2: "", week3: "", week4: "", week5: "" }
          };
        });
      });

      dbRecords.forEach((r: any) => {
        if (newForm[r.userId] && newForm[r.userId][r.category]) {
           newForm[r.userId][r.category][r.colorMode] = {
             initial: r.initial ?? "",
             week1: r.week1 ?? "",
             week2: r.week2 ?? "",
             week3: r.week3 ?? "",
             week4: r.week4 ?? "",
             week5: r.week5 ?? "",
           };
        }
      });
      
      setFormData(newForm);
    }
    setLoading(false);
  };

  const handleInputChange = (userId: string, category: string, colorMode: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [category]: {
          ...prev[userId][category],
          [colorMode]: {
            ...prev[userId][category][colorMode],
            [field]: value === "" ? "" : parseInt(value)
          }
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToSave: any[] = [];
      const targetUsers = canSeeAllUsers ? usersList : [{ id: session?.user?.id }];
      
      targetUsers.forEach(u => {
        CATEGORIES.forEach(cat => {
          COLOR_MODES.forEach(color => {
            const data = formData[u.id]?.[cat]?.[color];
            if (data) {
              recordsToSave.push({
                userId: u.id,
                category: cat,
                colorMode: color,
                initial: data.initial === "" ? null : data.initial,
                week1: data.week1 === "" ? null : data.week1,
                week2: data.week2 === "" ? null : data.week2,
                week3: data.week3 === "" ? null : data.week3,
                week4: data.week4 === "" ? null : data.week4,
                week5: data.week5 === "" ? null : data.week5,
              });
            }
          });
        });
      });

      const res = await fetch("/fcmm/api/records/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          records: recordsToSave
        })
      });

      if (res.ok) {
        showAlert({ title: "Berhasil", message: "Data berhasil disimpan!", type: "success" });
      } else {
        showAlert({ title: "Gagal", message: "Gagal menyimpan data.", type: "error" });
      }
    } catch (e) {
      showAlert({ title: "Error", message: "Terjadi kesalahan saat menyimpan data.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (selectedUsers.length === 0) {
      showAlert({ title: "Peringatan", message: "Pilih setidaknya satu pengguna untuk diberitahu.", type: "warning" });
      return;
    }
    
    setSendingEmail(true);
    try {
      const res = await fetch("/fcmm/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers, month, year })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert({ title: "Berhasil", message: `Email berhasil dikirim ke ${data.sentCount} pengguna.`, type: "success" });
        setSelectedUsers([]);
      } else {
        showAlert({ title: "Gagal", message: data.error || "Gagal mengirim email.", type: "error" });
      }
    } catch (e) {
      showAlert({ title: "Error", message: "Terjadi kesalahan saat mengirim email.", type: "error" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleHide = async (userId: string, currentStatus: boolean) => {
    setTogglingHide(userId);
    try {
      const res = await fetch(`/fcmm/api/users/${userId}/hide`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !currentStatus })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isHidden: !currentStatus } : u));
      } else {
        showAlert({ title: "Error", message: "Failed to update hide status.", type: "error" });
      }
    } catch (e) {
      showAlert({ title: "Error", message: "Failed to update hide status.", type: "error" });
    } finally {
      setTogglingHide(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const calculateUsage = (current: number | string | undefined | null, previous: number | string | undefined | null) => {
    if (current === "" || previous === "" || current == null || previous == null) return "-";
    const usage = Number(current) - Number(previous);
    return isNaN(usage) ? "-" : usage;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number, color: string, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = document.getElementById(`input-${idx + 1}-${color}-${field}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.target as HTMLElement).blur();
  };

  const renderCell = (userId: string, idx: number, color: string, field: string) => {
    const isHidden = usersList.find(u => u.id === userId)?.isHidden;
    const val = formData[userId]?.[activeCategory]?.[color]?.[field];
    return (
      <input 
        id={`input-${idx}-${color}-${field}`}
        type="number" 
        value={val ?? ""} 
        disabled={isHidden || isReadOnly}
        onChange={(e) => handleInputChange(userId, activeCategory, color, field, e.target.value)} 
        onKeyDown={(e) => handleKeyDown(e, idx, color, field)}
        onWheel={handleWheel}
        className={`w-[70px] px-2 py-1.5 text-right border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] ${(isHidden || isReadOnly) ? 'opacity-50 cursor-not-allowed' : ''}`} 
      />
    );
  };

  const renderCalculatedCell = (userId: string, color: string, currentField: string, prevField: string) => {
    const current = formData[userId]?.[activeCategory]?.[color]?.[currentField];
    const prev = formData[userId]?.[activeCategory]?.[color]?.[prevField];
    const usage = calculateUsage(current, prev);
    return (
      <span className="font-bold text-[var(--primary-600)]">{usage}</span>
    );
  };

  const renderTotalMonth = (userId: string, color: string) => {
    const data = formData[userId]?.[activeCategory]?.[color];
    if (!data) return "-";
    
    let lastValue = "";
    if (data.week5 !== "") lastValue = data.week5;
    else if (data.week4 !== "") lastValue = data.week4;
    else if (data.week3 !== "") lastValue = data.week3;
    else if (data.week2 !== "") lastValue = data.week2;
    else if (data.week1 !== "") lastValue = data.week1;
    
    return calculateUsage(lastValue, data.initial);
  };

  const calculateGrandTotalUsage = (color: string, currentField: string, prevField: string) => {
    let total = 0;
    const targetUsers = session?.user?.role === "ADMIN" ? usersList : [{ id: session?.user?.id }];
    targetUsers.forEach(u => {
      if (u.isHidden) return;
      const current = formData[u.id]?.[activeCategory]?.[color]?.[currentField];
      const prev = formData[u.id]?.[activeCategory]?.[color]?.[prevField];
      const usage = calculateUsage(current, prev);
      if (usage !== "-") {
        total += Number(usage);
      }
    });
    return total;
  };

  const calculateGrandTotalMonth = (color: string) => {
    let total = 0;
    const targetUsers = session?.user?.role === "ADMIN" ? usersList : [{ id: session?.user?.id }];
    targetUsers.forEach(u => {
      if (u.isHidden) return;
      const usage = renderTotalMonth(u.id, color);
      if (usage !== "-") {
        total += Number(usage);
      }
    });
    return total;
  };

  const calculateGrandTotalInput = (color: string, field: string) => {
    let total = 0;
    const targetUsers = canSeeAllUsers ? usersList : [{ id: session?.user?.id }];
    targetUsers.forEach(u => {
      if (u.isHidden) return;
      const val = formData[u.id]?.[activeCategory]?.[color]?.[field];
      if (val !== "" && val !== null && val !== undefined) {
        total += Number(val);
      }
    });
    return total;
  };

  const targetUsers = canSeeAllUsers ? usersList : [{ id: session?.user?.id, name: session?.user?.name, username: (session?.user as any)?.username }];

  return (
    <div className="space-y-6 pb-12">
      <div className="page-header">
        <div>
          <h1>Input Meteran Data</h1>
          <p>Masukkan nilai absolut dari mesin fotokopi. Kalkulasi otomatis.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="form-control py-2 w-full md:w-[140px]">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Bulan {m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="form-control py-2 w-full md:w-[140px]">
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {!isReadOnly && (
            <button 
              onClick={handleSave} 
              disabled={saving || loading}
              className="w-full md:w-auto btn-primary"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span className="ml-2">Simpan Data</span>
            </button>
          )}
          {session?.user?.role === "ADMIN" && (
            <button 
              onClick={handleSendEmail} 
              disabled={sendingEmail || loading}
              className="w-full md:w-auto btn-primary"
            >
              {sendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              <span className="ml-2">Kirim Email</span>
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Tabs */}
        <div className="flex p-2 bg-[var(--bg-color)] border-b border-[var(--border-color)]">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-3 px-4 mx-1 rounded-xl text-center font-bold text-sm transition-all ${activeCategory === cat ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/50'}`}
            >
              {formatCategory(cat)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary-500)]" /></div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-max border-collapse border border-[var(--border-color)] text-sm w-full">
              <thead>
                <tr className="bg-[var(--bg-color)] text-[var(--text-primary)] divide-x divide-[var(--border-color)]">
                  <th rowSpan={3} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] md:sticky left-0 z-20 bg-[var(--bg-color)]">
                    {session?.user?.role === "ADMIN" ? "Sel" : "No"}
                  </th>
                  {session?.user?.role === "ADMIN" && (
                    <th rowSpan={3} className="px-2 py-2 text-center font-extrabold border-b border-[var(--border-color)] md:sticky left-[42px] z-20 bg-[var(--bg-color)]">Sembunyikan</th>
                  )}
                  <th rowSpan={3} className={`px-4 py-2 text-center font-extrabold border-b border-[var(--border-color)] md:sticky ${session?.user?.role === "ADMIN" ? 'left-[108px]' : 'left-[42px]'} z-20 bg-[var(--bg-color)]`}>Nama Pengguna</th>
                  <th rowSpan={3} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)]">User ID</th>
                  
                  {['Initial (Baseline)', 'W1', 'W2', 'W3', 'W4', 'W5'].map((wLabel, index) => {
                    const wKey = index === 0 ? 'Initial' : `W${index}`;
                    return (
                      <React.Fragment key={wKey}>
                        <th colSpan={2} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] bg-[var(--warning-500)]/10 text-[var(--warning-500)]">
                          <div className="flex items-center justify-center gap-2">
                            <span>{wLabel}</span>
                            {!isReadOnly && <button onClick={() => { setSelectedWeek(wKey); setShowUploadModal(true); }} className="hover:text-[var(--primary-600)] transition-colors" title={`Upload ${wKey} Reference`}><UploadCloud size={14}/></button>}
                            {referenceFiles[wKey] && <button onClick={() => { setViewingFileUrl(referenceFiles[wKey]); setShowViewModal(true); }} className="text-[var(--primary-500)] hover:text-[var(--primary-700)] transition-colors" title={`View ${wKey} Reference`}><FileText size={14}/></button>}
                          </div>
                        </th>
                        {index > 0 && <th colSpan={2} className="px-3 py-2 text-center font-bold border-b border-[var(--border-color)] bg-[var(--bg-color)]">Total {wKey}</th>}
                      </React.Fragment>
                    )
                  })}
                  <th colSpan={2} className="px-3 py-2 text-center font-extrabold border-b border-[var(--border-color)] bg-[var(--danger-500)]/10 text-[var(--danger-500)]">Total Bulan Ini</th>
                </tr>
                
                <tr className="bg-[var(--bg-card)] text-[var(--text-secondary)] divide-x divide-[var(--border-color)]">
                  {Array.from({length: 12}).map((_, i) => (
                    <td key={i} colSpan={2} className="p-0 border-b border-[var(--border-color)]">
                      <div className="flex divide-x divide-[var(--border-color)]">
                        <div className="flex-1 px-1 py-1.5 text-center font-semibold text-[11px]">B&W</div>
                        <div className="flex-1 px-1 py-1.5 text-center font-semibold text-[11px] text-[var(--primary-500)]">Color</div>
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-[var(--border-color)]">
                {targetUsers.filter(u => !(isLeader && u.isHidden)).map((u, idx) => (
                  <tr key={u.id || `user-${idx}`} className={`hover:bg-[var(--bg-color)] divide-x divide-[var(--border-color)] transition-colors ${u.isHidden ? 'opacity-50 bg-[var(--bg-color)]/50' : ''}`}>
                    <td className="px-3 py-2 text-center sticky left-0 z-10 bg-[var(--bg-card)] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      {session?.user?.role === "ADMIN" ? (
                        <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUserSelection(u.id)} className="w-4 h-4 rounded text-[var(--primary-500)] focus:ring-[var(--primary-500)] cursor-pointer" />
                      ) : (
                        idx + 1
                      )}
                    </td>
                    {session?.user?.role === "ADMIN" && (
                      <td className="px-2 py-2 text-center md:sticky left-[42px] z-10 bg-[var(--bg-card)] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        {togglingHide === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto text-[var(--primary-500)]" />
                        ) : (
                          <input type="checkbox" checked={!!u.isHidden} onChange={() => handleToggleHide(u.id, !!u.isHidden)} className="w-4 h-4 rounded text-gray-500 cursor-pointer" title="Hide this user" />
                        )}
                      </td>
                    )}
                    <td className={`px-4 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap md:sticky ${session?.user?.role === "ADMIN" ? 'left-[108px]' : 'left-[42px]'} z-10 bg-[var(--bg-card)] shadow-[2px_0_5px_rgba(0,0,0,0.02)]`}>
                      {u.name} {u.isHidden && <span className="text-xs text-[var(--danger-500)] ml-1">(Hidden)</span>}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{u.username}</td>
                    
                    {/* Initial */}
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "BW", "initial")}</td>
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "COLOR", "initial")}</td>
                    
                    {/* W1 */}
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "BW", "week1")}</td>
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "COLOR", "week1")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "BW", "week1", "initial")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "COLOR", "week1", "initial")}</td>
                    
                    {/* W2 */}
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "BW", "week2")}</td>
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "COLOR", "week2")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "BW", "week2", "week1")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "COLOR", "week2", "week1")}</td>
                    
                    {/* W3 */}
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "BW", "week3")}</td>
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "COLOR", "week3")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "BW", "week3", "week2")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "COLOR", "week3", "week2")}</td>
                    
                    {/* W4 */}
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "BW", "week4")}</td>
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "COLOR", "week4")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "BW", "week4", "week3")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "COLOR", "week4", "week3")}</td>
                    
                    {/* W5 */}
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "BW", "week5")}</td>
                    <td className="px-1 py-1 bg-[var(--warning-500)]/5 text-center">{renderCell(u.id, idx, "COLOR", "week5")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "BW", "week5", "week4")}</td>
                    <td className="px-3 py-2 text-center bg-[var(--bg-color)]">{renderCalculatedCell(u.id, "COLOR", "week5", "week4")}</td>
                    
                    {/* Total Bulan */}
                    <td className="px-3 py-2 text-center font-extrabold text-[var(--danger-500)] bg-[var(--danger-500)]/10">{renderTotalMonth(u.id, "BW")}</td>
                    <td className="px-3 py-2 text-center font-extrabold text-[var(--danger-500)] bg-[var(--danger-500)]/10">{renderTotalMonth(u.id, "COLOR")}</td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-[var(--bg-color)] font-bold divide-x divide-[var(--border-color)]">
                  <td className="px-4 py-3 md:sticky left-0 z-10 bg-[var(--bg-color)]"></td>
                  {session?.user?.role === "ADMIN" && (
                    <td className="px-4 py-3 md:sticky left-[42px] z-10 bg-[var(--bg-color)]"></td>
                  )}
                  <td className={`px-4 py-3 text-right md:sticky ${session?.user?.role === "ADMIN" ? 'left-[108px]' : 'left-[42px]'} z-10 bg-[var(--bg-color)]`}>Total</td>
                  <td className="px-4 py-3 text-right"></td>
                  
                  <td className="px-3 py-3 text-center">{calculateGrandTotalInput("BW", "initial")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-500)]">{calculateGrandTotalInput("COLOR", "initial")}</td>
                  
                  <td className="px-3 py-3 text-center">{calculateGrandTotalInput("BW", "week1")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-500)]">{calculateGrandTotalInput("COLOR", "week1")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("BW", "week1", "initial")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("COLOR", "week1", "initial")}</td>
                  
                  <td className="px-3 py-3 text-center">{calculateGrandTotalInput("BW", "week2")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-500)]">{calculateGrandTotalInput("COLOR", "week2")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("BW", "week2", "week1")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("COLOR", "week2", "week1")}</td>
                  
                  <td className="px-3 py-3 text-center">{calculateGrandTotalInput("BW", "week3")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-500)]">{calculateGrandTotalInput("COLOR", "week3")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("BW", "week3", "week2")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("COLOR", "week3", "week2")}</td>
                  
                  <td className="px-3 py-3 text-center">{calculateGrandTotalInput("BW", "week4")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-500)]">{calculateGrandTotalInput("COLOR", "week4")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("BW", "week4", "week3")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("COLOR", "week4", "week3")}</td>
                  
                  <td className="px-3 py-3 text-center">{calculateGrandTotalInput("BW", "week5")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-500)]">{calculateGrandTotalInput("COLOR", "week5")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("BW", "week5", "week4")}</td>
                  <td className="px-3 py-3 text-center text-[var(--primary-600)]">{calculateGrandTotalUsage("COLOR", "week5", "week4")}</td>
                  
                  <td className="px-3 py-3 text-center text-[var(--danger-500)]">{calculateGrandTotalMonth("BW")}</td>
                  <td className="px-3 py-3 text-center text-[var(--danger-500)]">{calculateGrandTotalMonth("COLOR")}</td>
                </tr>
                
                {/* Grandtotal Row */}
                <tr className="bg-[var(--primary-500)] text-white font-black divide-x divide-white/20">
                  <td className="px-4 py-4 text-right sticky left-0 z-10 bg-[var(--primary-500)] shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></td>
                  {session?.user?.role === "ADMIN" && (
                    <td className="px-4 py-4 sticky left-[42px] z-10 bg-[var(--primary-500)] shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></td>
                  )}
                  <td className={`px-4 py-4 text-right sticky ${session?.user?.role === "ADMIN" ? 'left-[108px]' : 'left-[42px]'} z-10 bg-[var(--primary-500)] shadow-[2px_0_5px_rgba(0,0,0,0.1)]`}>GRANDTOTAL</td>
                  <td className="px-4 py-4 bg-[var(--primary-500)]"></td>
                  <td colSpan={24} className="px-4 py-4 text-center text-2xl tracking-tight">
                     {(calculateGrandTotalMonth("BW") + calculateGrandTotalMonth("COLOR")).toLocaleString()} Lembar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setShowUploadModal(false)}></div>
          <div className="relative w-full md:max-w-md bg-[var(--bg-card)] rounded-t-[32px] md:rounded-3xl p-6 md:p-8 animate-slide-up-sheet md:animate-in md:zoom-in-95 shadow-2xl">
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-6 md:hidden"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-[var(--text-primary)]">Upload Referensi</h3>
              <button type="button" onClick={() => setShowUploadModal(false)} className="text-[var(--text-secondary)] hover:bg-[var(--bg-color)] p-2 rounded-full transition-colors hidden md:block">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Unggah bukti foto/PDF referensi meteran untuk minggu <strong>{selectedWeek}</strong> - Kategori {formatCategory(activeCategory)}, Bulan {month}, {year}.
              </p>
              
              <div className="form-group pt-2">
                <input type="file" required accept="image/*,.pdf" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-500)]/10 file:text-[var(--primary-500)] hover:file:bg-[var(--primary-500)]/20 cursor-pointer" />
              </div>

              <div className="pt-4 flex flex-col md:flex-row-reverse gap-3">
                <button type="submit" disabled={uploading} className="w-full md:w-auto btn-primary flex-1">
                  {uploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                  {uploading ? 'Mengunggah...' : 'Upload'}
                </button>
                <button type="button" onClick={() => setShowUploadModal(false)} className="w-full md:w-auto btn-secondary flex-1">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingFileUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowViewModal(false)}></div>
          <div className="relative w-full max-w-4xl bg-[var(--bg-card)] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-4 flex justify-between items-center border-b border-[var(--border-color)]">
              <h3 className="text-xl font-extrabold text-[var(--text-primary)]">Referensi {selectedWeek}</h3>
              <button type="button" onClick={() => setShowViewModal(false)} className="text-[var(--text-secondary)] hover:bg-[var(--bg-color)] p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-[var(--bg-color)] flex justify-center items-center overflow-auto" style={{ maxHeight: '80vh' }}>
              {viewingFileUrl && (() => {
                  let safeUrl = viewingFileUrl.replace('/fcmm-system', '/fcmm');
                  // Legacy support: redirect static uploads to dynamic API uploads
                  safeUrl = safeUrl.replace('/fcmm/uploads/', '/fcmm/api/uploads/').replace('/uploads/', '/fcmm/api/uploads/');
                  const finalUrl = safeUrl.startsWith('/fcmm') ? safeUrl : `/fcmm${safeUrl}`;
                  
                  return finalUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={finalUrl} className="w-full min-h-[60vh] border-0 rounded-xl" title="Reference PDF" />
                  ) : (
                    <img src={finalUrl} alt="Reference" className="max-w-full h-auto rounded-xl shadow-sm" />
                  );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
