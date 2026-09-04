"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid username or password");
      setIsLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-zinc-950">
      {/* Left Panel: Branding (Industrial look) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-zinc-900 text-white flex-col justify-between p-12 border-r border-zinc-800">
        <div>
          <div className="w-24 h-24 bg-white rounded-sm p-2 flex items-center justify-center mb-8 border border-zinc-700 shadow-[4px_4px_0px_rgba(220,38,38,1)]">
            <img src="/fcmm-system/logo.png?v=2" alt="Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-tight text-zinc-100">
            FCMM<br/>
            <span className="text-primary-500">SYSTEM</span>
          </h1>
          <p className="mt-6 text-zinc-400 font-mono text-sm max-w-md uppercase tracking-wider">
            Facility Copy Machine Management • Centralized Control Terminal
          </p>
        </div>
        
        <div className="font-mono text-xs text-zinc-600 uppercase tracking-widest flex justify-between border-t border-zinc-800 pt-6">
          <span>SECURE ACCESS ONLY</span>
          <span>SYS_VER_2.0</span>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center mb-10">
             <div className="w-20 h-20 bg-white rounded-sm p-2 flex items-center justify-center mb-4 border-2 border-zinc-900 dark:border-zinc-700 shadow-[4px_4px_0px_rgba(220,38,38,1)]">
                <img src="/fcmm-system/logo.png?v=2" alt="Logo" className="max-w-full max-h-full object-contain" />
             </div>
             <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                FCMM <span className="text-primary-600">SYSTEM</span>
             </h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 rounded-sm shadow-sm relative">
            {/* Industrial corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary-600 -mt-0.5 -ml-0.5"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-600 -mt-0.5 -mr-0.5"></div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                Terminal Login
              </h2>
              <div className="h-1 w-12 bg-primary-600 mt-4"></div>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-500 text-red-700 dark:text-red-400 p-4 rounded-sm text-sm font-medium uppercase tracking-wide flex items-center">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  IDENTIFIER (Username)
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-sm focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors font-mono text-sm"
                  placeholder="Enter ID..."
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  SECURITY KEY (Password)
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-sm focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors font-mono text-sm"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-4 px-4 border-2 border-primary-600 text-sm font-bold rounded-sm text-white bg-primary-600 hover:bg-primary-700 hover:border-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "AUTHENTICATING..." : "AUTHORIZE ACCESS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
