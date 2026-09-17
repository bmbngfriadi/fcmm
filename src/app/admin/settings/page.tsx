"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by rendering only after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-2xl pb-12 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-[var(--text-primary)]">Pengaturan</h1>
          <p className="text-sm text-[var(--text-secondary)]">Atur preferensi aplikasi Anda</p>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--primary-500)]"></div>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Penampilan (Appearance)</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Pilih tema aplikasi yang Anda inginkan (Terang atau Gelap).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-300 font-semibold ${
                  theme === 'light' 
                    ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10 text-[var(--primary-500)]' 
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-color)]'
                }`}
              >
                <Sun className={`w-8 h-8 mb-3 transition-colors ${theme === 'light' ? 'text-[var(--primary-500)]' : 'text-[var(--text-secondary)]'}`} />
                <span>Terang (Light)</span>
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-300 font-semibold ${
                  theme === 'dark' 
                    ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10 text-[var(--primary-500)]' 
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-color)]'
                }`}
              >
                <Moon className={`w-8 h-8 mb-3 transition-colors ${theme === 'dark' ? 'text-[var(--primary-500)]' : 'text-[var(--text-secondary)]'}`} />
                <span>Gelap (Dark)</span>
              </button>
              
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-300 font-semibold ${
                  theme === 'system' 
                    ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10 text-[var(--primary-500)]' 
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-color)]'
                }`}
              >
                <Monitor className={`w-8 h-8 mb-3 transition-colors ${theme === 'system' ? 'text-[var(--primary-500)]' : 'text-[var(--text-secondary)]'}`} />
                <span>Otomatis (System)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
