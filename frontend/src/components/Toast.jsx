// frontend/src/components/Toast.jsx
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: { bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: 'text-emerald-600', bar: 'bg-emerald-500' },
  error:   { bg: 'bg-red-50',      border: 'border-red-200',     icon: 'text-red-600',     bar: 'bg-red-500' },
  warning: { bg: 'bg-amber-50',    border: 'border-amber-200',   icon: 'text-amber-600',   bar: 'bg-amber-500' },
  info:    { bg: 'bg-blue-50',     border: 'border-blue-200',    icon: 'text-blue-600',    bar: 'bg-blue-500' },
};

const Toast = ({ id, type = 'info', title, message, duration = 4000, onDismiss }) => {
  const [exiting, setExiting] = useState(false);
  const style = STYLES[type] || STYLES.info;
  const Icon  = ICONS[type]  || Info;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl max-w-sm w-full
      ${style.bg} ${style.border} ${exiting ? 'animate-toast-out' : 'animate-toast-in'}`}>
      <Icon size={20} className={`${style.icon} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-bold text-slate-800 text-sm">{title}</p>}
        {message && <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{message}</p>}
        {duration > 0 && (
          <div className="mt-2 h-1 bg-slate-200/60 rounded-full overflow-hidden">
            <div className={`h-full ${style.bar} rounded-full`}
              style={{ animation: `toastProgress ${duration}ms linear forwards` }} />
          </div>
        )}
      </div>
      <button onClick={dismiss}
        className="p-1 hover:bg-black/5 rounded-lg transition shrink-0">
        <X size={14} className="text-slate-400" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((opts) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...opts }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type, title, message, duration) => {
    return addToast({ type, title, message, duration });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default Toast;
