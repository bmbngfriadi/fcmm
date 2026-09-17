"use client";

import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-color)] lg:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
      {/* Sidebar handles both Desktop (left) and Mobile (bottom) */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto w-full px-5 pt-6 lg:px-0 lg:pt-0 lg:ml-6">
        <main className="flex-1 rounded-2xl overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
