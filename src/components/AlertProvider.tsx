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

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && alertState.isOpen) {
        handleCancel(); // Escape means cancel/close
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [alertState.isOpen, alertState.options]);

  const { options, isOpen } = alertState;
  
  const icons = {
    info: <Info className="w-6 h-6 text-blue-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    error: <AlertTriangle className="w-6 h-6 text-red-500" />,
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-900/80 animate-in fade-in duration-200"
            onClick={handleCancel}
          />
          <div
            className="relative z-10 w-full max-w-sm bg-zinc-50 dark:bg-zinc-900 rounded-sm shadow-md overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Industrial corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary-600"></div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {icons[options.type || "info"]}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                    {options.title || (options.type ? options.type.charAt(0).toUpperCase() + options.type.slice(1) : "Notification")}
                  </h3>
                </div>
                <button onClick={handleCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm font-mono">{options.message}</p>
            </div>
            
            <div className="bg-zinc-100 dark:bg-zinc-950 px-6 py-4 flex flex-col md:flex-row-reverse gap-3 border-t-2 border-zinc-200 dark:border-zinc-800">
              <button
                onClick={handleConfirm}
                className={`w-full md:w-auto inline-flex justify-center rounded-sm px-5 py-2 text-xs font-bold text-white transition-all uppercase tracking-widest border-2
                  ${options.type === 'error' ? 'bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700' : 
                    options.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500 hover:border-yellow-600' : 
                    'bg-primary-600 hover:bg-primary-700 border-primary-600 hover:border-primary-700'}`
                }
              >
                {options.confirmText || "OK"}
              </button>
              {options.showCancel && (
                <button
                  onClick={handleCancel}
                  className="w-full md:w-auto inline-flex justify-center rounded-sm border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all uppercase tracking-widest"
                >
                  {options.cancelText || "CANCEL"}
                </button>
              )}
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
