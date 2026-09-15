"use client";

import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-sm p-1 border-2 border-zinc-800 shadow-[2px_2px_0px_rgba(220,38,38,1)]">
              <img src="/fcmm/logo.png?v=2" alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <span className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-lg">FCMM<span className="text-primary-600">SYS</span></span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
