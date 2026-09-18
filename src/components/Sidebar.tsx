"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Printer, BarChart3, Settings, LogOut, LayoutDashboard, MoreHorizontal } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, show: true },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, show: true },
    { name: "Data Entry", href: "/admin/entry", icon: Printer, show: true },
    { name: "Users", href: "/admin/users", icon: Users, show: isAdmin },
    { name: "Settings", href: "/admin/settings", icon: Settings, show: isAdmin || session?.user?.role === "LEADER" },
  ];

  const visibleItems = navItems.filter(item => item.show);
  // For mobile bottom nav, take first 4, if more than 4, put rest in "More"
  const bottomNavItems = visibleItems.slice(0, 4);
  const hasMore = visibleItems.length > 4;
  const moreItems = visibleItems.slice(4);

  return (
    <>
      {/* Desktop Sidebar (lg:flex) */}
      <div className="hidden lg:flex flex-col w-72 sticky top-6 h-[calc(100vh-3rem)] glass-card overflow-hidden shrink-0 z-10">
        <div className="p-8 border-b border-[var(--border-color)] flex flex-col items-center">
          <div className="w-16 h-16 bg-[var(--bg-card)] rounded-2xl p-2 flex items-center justify-center mb-4 shadow-sm border border-[var(--border-color)]">
            <img src="/fcmm/logo.png" alt="Logo" className="max-w-full max-h-full object-contain filter drop-shadow-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">FCMM<span className="text-[var(--primary-500)]">System</span></h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-2">Menu Utama</div>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm ${
                    isActive 
                      ? "bg-[var(--primary-500)] text-white shadow-[0_4px_12px_rgba(181,32,37,0.25)]" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-primary)] hover:translate-x-1"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-[var(--border-color)] bg-[var(--bg-color)]/30">
          <div className="flex items-center mb-4 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[var(--primary-500)] flex items-center justify-center text-white font-bold mr-3 shadow-sm">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-[var(--text-primary)] text-sm truncate">{session?.user?.name}</p>
              <p className="text-xs text-[var(--text-secondary)] font-medium capitalize truncate">{session?.user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold text-[var(--danger-500)] bg-[var(--danger-500)]/5 hover:bg-[var(--danger-500)]/10 border border-[var(--danger-500)]/30 hover:border-[var(--danger-500)] rounded-xl transition-all duration-300 hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 group"
          >
            <LogOut className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            Keluar
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl rounded-b-none border-b-0 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex-1 flex flex-col items-center py-2 px-1 relative group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[var(--primary-500)]/10 text-[var(--primary-500)] scale-110' : 'text-[var(--text-secondary)]'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'fill-[var(--primary-500)]/10' : ''}`} />
                </div>
                <span className={`text-[10px] font-semibold mt-1 transition-all whitespace-nowrap ${isActive ? 'text-[var(--primary-500)]' : 'text-[var(--text-secondary)]'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          {hasMore && (
            <button
              onClick={() => setShowMoreMenu(true)}
              className="flex-1 flex flex-col items-center py-2 px-1 relative group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] transition-all duration-300">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold mt-1 text-[var(--text-secondary)] whitespace-nowrap">
                Lainnya
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Bottom Sheet) */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative w-full bg-[var(--bg-card)] rounded-t-[32px] p-6 animate-slide-up-sheet shadow-2xl border-t border-[var(--border-color)]">
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Menu Lainnya</h3>
            
            <div className="space-y-2 mb-6">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center p-4 rounded-xl transition-all font-semibold ${
                      isActive ? 'bg-[var(--primary-500)]/10 text-[var(--primary-500)]' : 'bg-[var(--bg-color)] text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-500)] flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-sm">{session?.user?.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] capitalize">{session?.user?.role?.toLowerCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-10 h-10 flex items-center justify-center text-[var(--danger-500)] bg-[var(--danger-500)]/5 border border-[var(--danger-500)]/30 rounded-full hover:bg-[var(--danger-500)]/10 hover:border-[var(--danger-500)] transition-all duration-300 hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 group"
              >
                <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end md:justify-center p-0 md:p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-[var(--bg-card)] rounded-t-[32px] md:rounded-3xl p-6 md:p-8 shadow-2xl w-full md:max-w-[440px] mx-auto animate-slide-up-sheet border-t md:border border-[var(--border-color)]">
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-6 md:hidden"></div>
            <div className="w-14 h-14 rounded-full bg-[var(--danger-500)]/15 flex items-center justify-center mb-6 mx-auto">
              <LogOut className="w-7 h-7 text-[var(--danger-500)]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] text-center mb-3 tracking-tight">Konfirmasi Keluar</h3>
            <p className="text-[var(--text-secondary)] text-center mb-8 font-medium">
              Apakah Anda yakin ingin keluar dari aplikasi? Anda harus masuk kembali untuk melanjutkan.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/fcmm/login' })}
                className="btn-danger flex-1"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
