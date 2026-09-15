"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Printer, BarChart3, Settings, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (val: boolean) => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: BarChart3, show: true },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, show: true },
    { name: "Data Entry", href: "/admin/entry", icon: Printer, show: true },
    { name: "User Management", href: "/admin/users", icon: Users, show: isAdmin },
    { name: "Settings", href: "/admin/settings", icon: Settings, show: isAdmin || session?.user?.role === "LEADER" },
  ];

  const sidebarContent = (
    <div className="flex flex-col w-64 bg-zinc-900 border-r-2 border-zinc-800 text-zinc-100 h-full">
      <div className="flex flex-col items-center justify-center py-8 border-b-2 border-zinc-800 relative">
        {setIsOpen && (
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="w-16 h-16 mb-4 flex items-center justify-center bg-white rounded-sm p-1.5 border border-zinc-700 shadow-[2px_2px_0px_rgba(220,38,38,1)]">
          <img src="/fcmm/logo.png?v=2" alt="Logo" className="max-w-full max-h-full object-contain" />
        </div>
        <span className="text-xl font-black uppercase tracking-widest text-white">FCMM<span className="text-primary-500">SYS</span></span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-2 px-4">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Main Menu</div>
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen && setIsOpen(false)}
                className={`group flex items-center px-4 py-3 rounded-sm transition-all duration-200 uppercase text-xs font-bold tracking-wider border-2 ${
                  isActive 
                    ? "bg-zinc-800 border-primary-600 text-white" 
                    : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary-500" : "text-zinc-500 group-hover:text-zinc-300"}`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t-2 border-zinc-800 bg-zinc-950">
        <div className="flex items-center text-sm mb-4">
          <div className="w-8 h-8 bg-primary-600 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 border-2 border-primary-800">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-white text-xs uppercase tracking-wider truncate">{session?.user?.name}</p>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest truncate">ROLE: {session?.user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/fcmm/login' })}
          className="flex items-center justify-center w-full px-2 py-3 text-xs font-bold text-red-500 border-2 border-zinc-800 hover:bg-red-950 hover:border-red-900 hover:text-red-400 rounded-sm transition-colors uppercase tracking-widest"
        >
          <LogOut className="mr-2 h-4 w-4" />
          TERMINATE SESS
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Sidebar */}
      {mounted && isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-zinc-950/80 transition-opacity" 
            onClick={() => setIsOpen && setIsOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
