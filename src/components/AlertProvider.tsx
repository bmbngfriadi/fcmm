"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

type AlertType = "info" | "success" | "warning" | "error";

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions | string) => void;
  showConfirm: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
  }>({
    isOpen: false,
    options: { message: "" },
  });

  const showAlert = (options: AlertOptions | string) => {
    if (typeof options === "string") {
      setAlertState({
        isOpen: true,
        options: { message: options, type: "info" },
      });
    } else {
      setAlertState({
        isOpen: true,
        options: { ...options, type: options.type || "info" },
      });
    }
  };

  const showConfirm = (options: AlertOptions) => {
    setAlertState({
      isOpen: true,
      options: {
        ...options,
        type: options.type || "warning",
        showCancel: true,
      },
    });
  };

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (alertState.options.onConfirm) {
      alertState.options.onConfirm();
    }
    closeAlert();
  };

  const handleCancel = () => {
    if (alertState.options.onCancel) {
      alertState.options.onCancel();
    }
    closeAlert();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && alertState.isOpen) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [alertState.isOpen, alertState.options]);

  const { options, isOpen } = alertState;
  
  const icons = {
    info: <Info className="w-8 h-8" />,
    success: <CheckCircle className="w-8 h-8" />,
    warning: <AlertTriangle className="w-8 h-8" />,
    error: <AlertTriangle className="w-8 h-8" />,
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCancel}
          />
          <div
            className="relative z-10 w-full max-w-md bg-[var(--bg-card)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-color)]"
          >
            <div className="p-8 text-center flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                options.type === 'error' ? 'bg-red-500/15 text-red-500' :
                options.type === 'warning' ? 'bg-yellow-500/15 text-yellow-500' :
                options.type === 'success' ? 'bg-green-500/15 text-green-500' :
                'bg-[var(--primary-500)]/15 text-[var(--primary-500)]'
              }`}>
                {icons[options.type || "info"]}
              </div>
              <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">
                {options.title || (options.type ? options.type.charAt(0).toUpperCase() + options.type.slice(1) : "Notification")}
              </h3>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{options.message}</p>
            </div>
            
            <div className="p-6 pt-0 flex gap-3">
              {options.showCancel && (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-full min-h-[48px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {options.cancelText || "Batal"}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`flex-1 px-6 py-3 font-semibold rounded-full min-h-[48px] text-white transition-transform hover:-translate-y-px shadow-sm
                  ${options.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 
                    options.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30' : 
                    'bg-[var(--primary-500)] hover:bg-[var(--primary-600)] shadow-[var(--primary-500)]/30'}`
                }
              >
                {options.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
