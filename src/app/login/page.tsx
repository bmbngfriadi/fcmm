"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, Moon, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setError("Username atau password salah.");
      setIsLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .login-left-panel {
          position: relative;
          width: 100%;
          min-height: 45vh;
          background-image: url('/fcmm/login-bg.jpg');
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .login-left-panel {
            width: 50%;
            min-height: 100vh;
          }
        }
        .login-left-panel::before {
          content: ''; 
          position: absolute; 
          inset: 0; 
          z-index: 1;
          background: linear-gradient(135deg, rgba(181, 32, 37, 0.75) 0%, rgba(133, 23, 27, 0.95) 50%, rgba(181, 32, 37, 0.75) 100%);
          background-size: 200% 200%;
          animation: bgShift 15s ease-in-out infinite;
        }
        .login-left-panel::after {
          content: ''; 
          position: absolute; 
          inset: 0; 
          z-index: 2;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        @keyframes bgShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}} />
      <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-color)]">

        {/* Left Panel: Branding */}
        <div className="login-left-panel flex flex-col justify-center lg:justify-between p-8 pt-12 lg:p-16 text-white relative items-center lg:items-start text-center lg:text-left pb-16 lg:pb-16">
          {/* Dark Mode Toggle (Mobile) */}
          <button
            className="lg:hidden absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all z-20 backdrop-blur-md"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <Moon className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex flex-col items-center lg:items-start mt-4 lg:mt-12 w-full">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-3xl p-3 flex items-center justify-center mb-6 lg:mb-8 shadow-lg">
              <img
                src="/fcmm/logo.png"
                alt="Logo"
                className="max-w-full max-h-full object-contain filter"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="text-xl font-bold text-red-700">SMP</div>';
                }}
              />
            </div>
            <h1 className="text-2xl lg:text-5xl font-extrabold tracking-tight mb-2 lg:mb-6 leading-tight">
              Photocopier Usage Monitoring System
            </h1>
            <div className="hidden lg:block w-12 h-1.5 bg-white mb-6 rounded-full"></div>
            <p className="text-white/90 max-w-md text-xs lg:text-lg font-medium leading-relaxed">
              Sistem informasi penggunaan mesin fotokopi.
            </p>
          </div>

          <div className="hidden lg:block relative z-10 mt-12 text-sm font-bold tracking-widest text-white/80 uppercase">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="w-full flex-grow lg:w-1/2 flex items-start lg:items-center justify-center p-8 lg:p-12 z-20 relative bg-[var(--bg-card)] lg:bg-[var(--bg-color)] rounded-t-[32px] lg:rounded-none -mt-8 lg:mt-0 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] lg:shadow-none pt-10 lg:pt-12">

          {/* Dark Mode Toggle (Desktop) */}
          <button
            className="hidden lg:flex absolute top-10 right-10 w-12 h-12 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-all shadow-sm"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <Moon className="w-5 h-5" />
          </button>

          <div className="w-full max-w-md lg:bg-[var(--bg-card)] lg:rounded-[32px] lg:p-12 lg:shadow-xl lg:border lg:border-[var(--border-color)] animate-fade-up">

            <div className="mb-8 lg:mb-10 text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0f172a] dark:text-white mb-2 lg:mb-3">
                Selamat Datang
              </h2>
              <p className="text-sm lg:text-base text-[#475569] dark:text-gray-400 font-medium">
                Silakan login untuk mengakses dashboard operasional.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-500/50 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm font-semibold flex items-center shadow-sm">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0f172a] dark:text-white">Username / Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl text-[#0f172a] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[var(--primary-500)] focus:ring-1 focus:ring-[var(--primary-500)] transition-all"
                    placeholder="Enter your username or email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#0f172a] dark:text-white">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl text-[#0f172a] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[var(--primary-500)] focus:ring-1 focus:ring-[var(--primary-500)] transition-all"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>



              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-4 bg-[#b52025] hover:bg-[#9e1c20] text-white font-bold rounded-xl transition-all hover:shadow-[0_8px_20px_rgba(181,32,37,0.3)] hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Sign In <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col space-y-4">
              <p className="text-[10px] lg:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center lg:text-left">
                © 2026 SEMEN MERAH PUTIH
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
