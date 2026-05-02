import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

// ── Context ────────────────────────────────────────────────
const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

// ── Toast item ─────────────────────────────────────────────
const ToastItem = ({ toast, onRemove }) => {
  const styles = {
    success: {
      bg:   'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle size={18} className="text-green-600 flex-shrink-0" />,
    },
    error: {
      bg:   'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle size={18} className="text-red-600 flex-shrink-0" />,
    },
    info: {
      bg:   'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <Info size={18} className="text-blue-600 flex-shrink-0" />,
    },
  };

  const style = styles[toast.type] || styles.info;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border
                     shadow-lg max-w-sm w-full animate-fade-in
                     ${style.bg}`}>
      {style.icon}
      <p className={`flex-1 text-sm font-medium ${style.text}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors
                   flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ── Provider ───────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container — top right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2
                      pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};