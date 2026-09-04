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
    <div className="space-y-6 max-w-2xl pb-12 mx-auto md:mx-0">
      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 border-2 border-zinc-200 dark:border-zinc-800 rounded-sm relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-8">Settings</h1>
        
        <div className="space-y-8">
          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-2">Appearance</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider mb-6">Select your preferred theme for the application.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-sm transition-colors overflow-hidden uppercase font-black text-xs tracking-widest ${
                  theme === 'light' 
                    ? 'border-primary-500 bg-primary-50/50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {theme === 'light' && <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20" />}
                <Sun className={`w-8 h-8 mb-3 z-10 transition-colors ${theme === 'light' ? 'text-primary-500' : ''}`} />
                <span className="font-bold z-10">Light</span>
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-sm transition-colors overflow-hidden uppercase font-black text-xs tracking-widest ${
                  theme === 'dark' 
                    ? 'border-primary-500 bg-primary-50/50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {theme === 'dark' && <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20" />}
                <Moon className={`w-8 h-8 mb-3 z-10 transition-colors ${theme === 'dark' ? 'text-primary-500' : ''}`} />
                <span className="font-bold z-10">Dark</span>
              </button>
              
              <button
                onClick={() => setTheme('system')}
                className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-sm transition-colors overflow-hidden uppercase font-black text-xs tracking-widest ${
                  theme === 'system' 
                    ? 'border-primary-500 bg-primary-50/50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {theme === 'system' && <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20" />}
                <Monitor className={`w-8 h-8 mb-3 z-10 transition-colors ${theme === 'system' ? 'text-primary-500' : ''}`} />
                <span className="font-bold z-10">System</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
