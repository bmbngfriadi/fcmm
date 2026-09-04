"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, UploadCloud, FileText, X, Send, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAlert } from "@/components/AlertProvider";

const CATEGORIES = ["PRINT", "COPY"];
const COLOR_MODES = ["BW", "COLOR"];

// Helper to format category for the tab
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

  // formData shape:
  // {
  //   [userId]: {
  //     [category]: { // PRINT, COPY, SCAN
  //       BW: { initial, week1, week2, week3, week4, week5 },
  //       COLOR: { initial, week1, week2, week3, week4, week5 }
  //     }
  //   }
  // }
  const [formData, setFormData] = useState<Record<string, any>>({});

  const isAdmin = session?.user?.role === "ADMIN";
  const isLeader = session?.user?.role === "LEADER";
  const isReadOnly = isLeader;
  const canSeeAllUsers = isAdmin || isLeader;

  useEffect(() => {
    if (canSeeAllUsers) {
      fetch("/fcmm-system/api/users").then(res => res.json()).then(data => {
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

  // Handle ESC key to close modals
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
      const res = await fetch(`/fcmm-system/api/upload?month=${month}&year=${year}&category=${activeCategory}`);
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
      const res = await fetch("/fcmm-system/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setReferenceFiles(prev => ({...prev, [selectedWeek]: data.fileUrl}));
        setShowUploadModal(false);
        setFileToUpload(null);
        showAlert({ title: "Success", message: "File uploaded successfully!", type: "success" });
      } else {
        showAlert({ title: "Error", message: "Failed to upload file.", type: "error" });
      }
    } catch (error) {
      showAlert({ title: "Error", message: "An unexpected error occurred.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    const res = await fetch(`/fcmm-system/api/records?month=${month}&year=${year}`);
    if (res.ok) {
      const dbRecords = await res.json();
      
      const newForm: Record<string, any> = {};
      
      // Initialize state for users
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

      // Populate with DB data
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
              // Only save if at least one field is filled, or if we need to ensure defaults
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

      const res = await fetch("/fcmm-system/api/records/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          records: recordsToSave
        })
      });

      if (res.ok) {
        showAlert({ title: "Success", message: "Data saved successfully!", type: "success" });
      } else {
        showAlert({ title: "Error", message: "Failed to save data.", type: "error" });
      }
    } catch (e) {
      showAlert({ title: "Error", message: "Failed to save data.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (selectedUsers.length === 0) {
      showAlert({ title: "Warning", message: "Please select at least one user to notify.", type: "warning" });
      return;
    }
    
    setSendingEmail(true);
    try {
      const res = await fetch("/fcmm-system/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers, month, year })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert({ title: "Success", message: `Successfully sent email to ${data.sentCount} user(s).`, type: "success" });
        setSelectedUsers([]);
      } else {
        showAlert({ title: "Error", message: data.error || "Failed to send email.", type: "error" });
      }
    } catch (e) {
      showAlert({ title: "Error", message: "Failed to send email.", type: "error" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleHide = async (userId: string, currentStatus: boolean) => {
    setTogglingHide(userId);
    try {
      const res = await fetch(`/fcmm-system/api/users/${userId}/hide`, {
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
      // Find the next input vertically (idx + 1)
      const nextInput = document.getElementById(`input-${idx + 1}-${color}-${field}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent the scroll wheel from changing the number value
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
        className={`w-[70px] px-1 py-1 text-right border border-zinc-300 dark:border-zinc-700 rounded text-sm bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary-500 ${(isHidden || isReadOnly) ? 'opacity-50 bg-zinc-100 cursor-not-allowed dark:bg-zinc-900' : ''}`} 
      />
    );
  };

  const renderCalculatedCell = (userId: string, color: string, currentField: string, prevField: string) => {
    const current = formData[userId]?.[activeCategory]?.[color]?.[currentField];
    const prev = formData[userId]?.[activeCategory]?.[color]?.[prevField];
    const usage = calculateUsage(current, prev);
    return (
      <span className="font-semibold text-primary-600 dark:text-primary-400">{usage}</span>
    );
  };

  const renderTotalMonth = (userId: string, color: string) => {
    // Total Month = W5 - Initial. (Or the last filled week - Initial)
    // To be precise, it's the sum of all usage. Which mathematically is (Last_Value - Initial)
    // Let's find the last filled week
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

  // Grand total calculations
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-sm relative gap-4">
        <div>
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Data Entry Spreadsheet</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono uppercase tracking-wider">Input machine absolute values. Totals calculate automatically.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="flex-1 md:flex-none px-4 py-2.5 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 font-mono text-sm uppercase transition-colors">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="flex-1 md:flex-none px-4 py-2.5 border-2 rounded-sm bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-primary-500 font-mono text-sm uppercase transition-colors">
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {!isReadOnly && (
            <button 
              onClick={handleSave} 
              disabled={saving || loading}
              className="w-full md:w-auto flex justify-center items-center px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white font-bold rounded-sm border-2 border-primary-600 hover:bg-primary-700 hover:border-primary-700 disabled:opacity-50 transition-colors uppercase tracking-widest text-xs"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Save Data
            </button>
          )}
          {session?.user?.role === "ADMIN" && (
            <button 
              onClick={handleSendEmail} 
              disabled={sendingEmail || loading}
              className="w-full md:w-auto flex justify-center items-center px-6 py-2.5 bg-orange-600 text-white font-bold rounded-sm border-2 border-orange-600 hover:bg-orange-700 hover:border-orange-700 disabled:opacity-50 transition-colors uppercase tracking-widest text-xs"
            >
              {sendingEmail ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
              Send Email
            </button>
          )}
        </div>
      </div>

      <div 
        className="bg-white dark:bg-zinc-900 rounded-sm border-2 border-zinc-200 dark:border-zinc-800 relative overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex border-b border-zinc-300 dark:border-zinc-700/50 bg-zinc-100 dark:bg-zinc-950">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative flex-1 py-3 mx-1 my-1 rounded-sm text-center font-black text-xs uppercase tracking-widest transition-all overflow-hidden ${activeCategory === cat ? 'bg-zinc-900 dark:bg-zinc-950 text-zinc-100 dark:text-zinc-300 border-2 border-zinc-900 dark:border-zinc-100' : 'bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-2 border-transparent'}`}
            >
              <span className="relative z-10">{formatCategory(cat)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-max border-collapse border border-zinc-300 dark:border-zinc-700 text-sm">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-zinc-900 dark:bg-zinc-950 text-zinc-100 dark:text-zinc-300 divide-x divide-zinc-800 dark:divide-zinc-200">
                  <th rowSpan={3} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 sticky left-0 z-20 bg-zinc-900 dark:bg-zinc-950 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                    {session?.user?.role === "ADMIN" ? "Sel" : "No"}
                  </th>
                  {session?.user?.role === "ADMIN" && (
                    <th rowSpan={3} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 sticky left-[36px] z-20 bg-zinc-900 dark:bg-zinc-950 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Hide</th>
                  )}
                  <th rowSpan={3} className={`px-4 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 sticky ${session?.user?.role === "ADMIN" ? 'left-[76px]' : 'left-[36px]'} z-20 bg-zinc-900 dark:bg-zinc-950 shadow-[2px_0_5px_rgba(0,0,0,0.1)]`}>Username</th>
                  <th rowSpan={3} className="px-3 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 hidden md:table-cell">User ID</th>
                  
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Initial (Baseline)</span>
                      {!isReadOnly && <button onClick={() => { setSelectedWeek("Initial"); setShowUploadModal(true); }} className="hover:text-primary-700 transition-colors" title="Upload Initial Reference"><UploadCloud size={14}/></button>}
                      {referenceFiles["Initial"] && <button onClick={() => { setViewingFileUrl(referenceFiles["Initial"]); setShowViewModal(true); }} className="text-primary-600 hover:text-primary-800 transition-colors" title="View Initial Reference"><FileText size={14}/></button>}
                    </div>
                  </th>
                  
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>W1</span>
                      {!isReadOnly && <button onClick={() => { setSelectedWeek("W1"); setShowUploadModal(true); }} className="hover:text-primary-700 transition-colors" title="Upload W1 Reference"><UploadCloud size={14}/></button>}
                      {referenceFiles["W1"] && <button onClick={() => { setViewingFileUrl(referenceFiles["W1"]); setShowViewModal(true); }} className="text-primary-600 hover:text-primary-800 transition-colors" title="View W1 Reference"><FileText size={14}/></button>}
                    </div>
                  </th>
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200">Total W1</th>
                  
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>W2</span>
                      {!isReadOnly && <button onClick={() => { setSelectedWeek("W2"); setShowUploadModal(true); }} className="hover:text-primary-700 transition-colors" title="Upload W2 Reference"><UploadCloud size={14}/></button>}
                      {referenceFiles["W2"] && <button onClick={() => { setViewingFileUrl(referenceFiles["W2"]); setShowViewModal(true); }} className="text-primary-600 hover:text-primary-800 transition-colors" title="View W2 Reference"><FileText size={14}/></button>}
                    </div>
                  </th>
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200">Total W2</th>
                  
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>W3</span>
                      {!isReadOnly && <button onClick={() => { setSelectedWeek("W3"); setShowUploadModal(true); }} className="hover:text-primary-700 transition-colors" title="Upload W3 Reference"><UploadCloud size={14}/></button>}
                      {referenceFiles["W3"] && <button onClick={() => { setViewingFileUrl(referenceFiles["W3"]); setShowViewModal(true); }} className="text-primary-600 hover:text-primary-800 transition-colors" title="View W3 Reference"><FileText size={14}/></button>}
                    </div>
                  </th>
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200">Total W3</th>
                  
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>W4</span>
                      {!isReadOnly && <button onClick={() => { setSelectedWeek("W4"); setShowUploadModal(true); }} className="hover:text-primary-700 transition-colors" title="Upload W4 Reference"><UploadCloud size={14}/></button>}
                      {referenceFiles["W4"] && <button onClick={() => { setViewingFileUrl(referenceFiles["W4"]); setShowViewModal(true); }} className="text-primary-600 hover:text-primary-800 transition-colors" title="View W4 Reference"><FileText size={14}/></button>}
                    </div>
                  </th>
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200">Total W4</th>
                  
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>W5</span>
                      {!isReadOnly && <button onClick={() => { setSelectedWeek("W5"); setShowUploadModal(true); }} className="hover:text-primary-700 transition-colors" title="Upload W5 Reference"><UploadCloud size={14}/></button>}
                      {referenceFiles["W5"] && <button onClick={() => { setViewingFileUrl(referenceFiles["W5"]); setShowViewModal(true); }} className="text-primary-600 hover:text-primary-800 transition-colors" title="View W5 Reference"><FileText size={14}/></button>}
                    </div>
                  </th>
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200">Total W5</th>
                  
                  <th colSpan={2} className="px-2 py-1 text-center font-bold border-2 border-zinc-800 dark:border-zinc-200">Total Bulan Ini</th>
                </tr>
                {/* Header Row 2 - B&W / Color */}
                <tr className="bg-primary-200 dark:bg-primary-900 text-black dark:text-white divide-x divide-gray-300 dark:divide-gray-600">
                  {Array.from({length: 12}).map((_, i) => (
                    <td key={i} colSpan={2} className="p-0 border-b border-zinc-300 dark:border-zinc-700">
                      <div className="flex divide-x divide-gray-300 dark:divide-gray-600">
                        <div className="flex-1 px-1 py-1 text-center font-semibold text-[11px]">Black & White</div>
                        <div className="flex-1 px-1 py-1 text-center font-semibold text-[11px]">Color</div>
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {targetUsers.filter(u => !(isLeader && u.isHidden)).map((u, idx) => (
                  <tr key={u.id || `user-${idx}`} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 divide-x divide-zinc-200 dark:divide-zinc-800 transition-colors ${u.isHidden ? 'opacity-60 bg-zinc-200 dark:bg-zinc-800' : ''}`}>
                    <td className="px-2 py-1 text-center text-zinc-500 sticky left-0 z-10 bg-white dark:bg-zinc-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {session?.user?.role === "ADMIN" ? (
                        <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUserSelection(u.id)} className="w-4 h-4 text-primary-600 rounded border-gray-300 cursor-pointer" />
                      ) : (
                        idx + 1
                      )}
                    </td>
                    {session?.user?.role === "ADMIN" && (
                      <td className="px-2 py-1 text-center sticky left-[36px] z-10 bg-white dark:bg-zinc-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        {togglingHide === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary-500" />
                        ) : (
                          <input type="checkbox" checked={!!u.isHidden} onChange={() => handleToggleHide(u.id, !!u.isHidden)} className="w-4 h-4 text-gray-600 rounded border-gray-300 cursor-pointer" title="Hide this user" />
                        )}
                      </td>
                    )}
                    <td className={`px-3 py-1 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap sticky ${session?.user?.role === "ADMIN" ? 'left-[76px]' : 'left-[36px]'} z-10 bg-white dark:bg-zinc-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]`}>
                      {u.name} {u.isHidden && <span className="text-xs text-red-500 ml-1">(Hidden)</span>}
                    </td>
                    <td className="px-2 py-1 text-zinc-500 hidden md:table-cell">{u.username}</td>
                    
                    {/* Initial */}
                    <td className="px-1 py-1">{renderCell(u.id, idx, "BW", "initial")}</td>
                    <td className="px-1 py-1">{renderCell(u.id, idx, "COLOR", "initial")}</td>
                    
                    {/* W1 */}
                    <td className="px-1 py-1">{renderCell(u.id, idx, "BW", "week1")}</td>
                    <td className="px-1 py-1">{renderCell(u.id, idx, "COLOR", "week1")}</td>
                    {/* Total W1 */}
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "BW", "week1", "initial")}</td>
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "COLOR", "week1", "initial")}</td>
                    
                    {/* W2 */}
                    <td className="px-1 py-1">{renderCell(u.id, idx, "BW", "week2")}</td>
                    <td className="px-1 py-1">{renderCell(u.id, idx, "COLOR", "week2")}</td>
                    {/* Total W2 */}
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "BW", "week2", "week1")}</td>
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "COLOR", "week2", "week1")}</td>
                    
                    {/* W3 */}
                    <td className="px-1 py-1">{renderCell(u.id, idx, "BW", "week3")}</td>
                    <td className="px-1 py-1">{renderCell(u.id, idx, "COLOR", "week3")}</td>
                    {/* Total W3 */}
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "BW", "week3", "week2")}</td>
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "COLOR", "week3", "week2")}</td>
                    
                    {/* W4 */}
                    <td className="px-1 py-1">{renderCell(u.id, idx, "BW", "week4")}</td>
                    <td className="px-1 py-1">{renderCell(u.id, idx, "COLOR", "week4")}</td>
                    {/* Total W4 */}
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "BW", "week4", "week3")}</td>
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "COLOR", "week4", "week3")}</td>
                    
                    {/* W5 */}
                    <td className="px-1 py-1">{renderCell(u.id, idx, "BW", "week5")}</td>
                    <td className="px-1 py-1">{renderCell(u.id, idx, "COLOR", "week5")}</td>
                    {/* Total W5 */}
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "BW", "week5", "week4")}</td>
                    <td className="px-2 py-1 text-right bg-zinc-100 dark:bg-zinc-950">{renderCalculatedCell(u.id, "COLOR", "week5", "week4")}</td>
                    
                    {/* Total Bulan */}
                    <td className="px-2 py-1 text-right font-bold text-red-600 bg-red-50 dark:bg-red-950">{renderTotalMonth(u.id, "BW")}</td>
                    <td className="px-2 py-1 text-right font-bold text-red-600 bg-red-50 dark:bg-red-950">{renderTotalMonth(u.id, "COLOR")}</td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white font-bold divide-x divide-gray-300">
                  <td className="px-4 py-2 text-right uppercase sticky left-0 z-10 bg-yellow-400 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></td>
                  {session?.user?.role === "ADMIN" && (
                    <td className="px-4 py-2 text-right uppercase sticky left-[36px] z-10 bg-yellow-400 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></td>
                  )}
                  <td className={`px-4 py-2 text-right uppercase sticky ${session?.user?.role === "ADMIN" ? 'left-[76px]' : 'left-[36px]'} z-10 bg-yellow-400 shadow-[2px_0_5px_rgba(0,0,0,0.1)]`}>Total</td>
                  <td className="px-4 py-2 text-right uppercase hidden md:table-cell"></td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("BW", "initial")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("COLOR", "initial")}</td>
                  
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("BW", "week1")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("COLOR", "week1")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("BW", "week1", "initial")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("COLOR", "week1", "initial")}</td>
                  
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("BW", "week2")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("COLOR", "week2")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("BW", "week2", "week1")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("COLOR", "week2", "week1")}</td>
                  
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("BW", "week3")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("COLOR", "week3")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("BW", "week3", "week2")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("COLOR", "week3", "week2")}</td>
                  
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("BW", "week4")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("COLOR", "week4")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("BW", "week4", "week3")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("COLOR", "week4", "week3")}</td>
                  
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("BW", "week5")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalInput("COLOR", "week5")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("BW", "week5", "week4")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalUsage("COLOR", "week5", "week4")}</td>
                  
                  <td className="px-2 py-2 text-right">{calculateGrandTotalMonth("BW")}</td>
                  <td className="px-2 py-2 text-right">{calculateGrandTotalMonth("COLOR")}</td>
                </tr>
                
                {/* Grandtotal Row */}
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black divide-x divide-orange-400/50 shadow-inner">
                  <td className="px-4 py-3 text-right uppercase tracking-wider text-sm sticky left-0 z-10 bg-orange-500 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></td>
                  {session?.user?.role === "ADMIN" && (
                    <td className="px-4 py-3 text-right uppercase tracking-wider text-sm sticky left-[36px] z-10 bg-orange-500 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></td>
                  )}
                  <td className={`px-4 py-3 text-right uppercase tracking-wider text-sm sticky ${session?.user?.role === "ADMIN" ? 'left-[76px]' : 'left-[36px]'} z-10 bg-orange-500 shadow-[2px_0_5px_rgba(0,0,0,0.1)]`}>Grandtotal</td>
                  <td className="px-4 py-3 hidden md:table-cell bg-orange-500"></td>
                  <td colSpan={24} className="px-4 py-3 text-center text-xl drop-shadow-md">
                     {(calculateGrandTotalMonth("BW") + calculateGrandTotalMonth("COLOR")).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      
        {showUploadModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-zinc-900/80 animate-in fade-in duration-200" onClick={() => setShowUploadModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative z-10 inline-block align-bottom bg-white dark:bg-zinc-900 rounded-sm text-left overflow-hidden shadow-md transform transition-all border-2 border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-zinc-200 dark:border-zinc-800">
                <form onSubmit={handleFileUpload}>
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Upload Reference File
                      </h3>
                      <button type="button" onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-700 p-1.5 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-gray-400 mb-4">Upload a print/scan file as the reference for <strong>{selectedWeek}</strong> in {formatCategory(activeCategory)}, Month {month}, {year}.</p>
                    <div className="space-y-5">
                      <div>
                        <input type="file" required accept="image/*,.pdf" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} className="block w-full text-sm text-zinc-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400 dark:hover:file:bg-primary-900/40" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-950 px-6 py-4 flex flex-col md:flex-row-reverse gap-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button type="submit" disabled={uploading} className="w-full md:w-auto inline-flex justify-center items-center rounded-xl border border-transparent shadow-md shadow-primary-500/20 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-sm font-bold text-white hover:from-primary-700 hover:to-primary-600 focus:outline-none transition-all disabled:opacity-50">
                      {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button type="button" onClick={() => setShowUploadModal(false)} className="w-full md:w-auto inline-flex justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-sm px-6 py-2.5 bg-white dark:bg-zinc-900 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showViewModal && viewingFileUrl && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
              <div className="fixed inset-0 bg-zinc-900/80 animate-in fade-in duration-200" onClick={() => setShowViewModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative z-10 inline-block align-middle bg-white dark:bg-zinc-900 rounded-sm text-left overflow-hidden shadow-md transform transition-all border-2 border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 sm:max-w-4xl sm:w-full border border-zinc-200 dark:border-zinc-800">
                <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Reference File - {selectedWeek}</h3>
                  <button type="button" onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-700 p-1.5 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-900/50 flex justify-center items-center overflow-auto" style={{ maxHeight: '80vh' }}>
                  {viewingFileUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={viewingFileUrl.startsWith('/fcmm-system') ? viewingFileUrl : `/fcmm-system${viewingFileUrl}`} className="w-full min-h-[60vh] border-0 rounded" title="Reference PDF" />
                  ) : (
                    <img src={viewingFileUrl.startsWith('/fcmm-system') ? viewingFileUrl : `/fcmm-system${viewingFileUrl}`} alt="Reference" className="max-w-full h-auto rounded shadow-sm" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      
    </div>
  );
}
