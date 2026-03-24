import { useEffect } from 'react';
import { AlertCircle, Trash2, X, ShieldAlert } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "XÁC NHẬN HÀNH ĐỘNG", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
  confirmText = "XÁC NHẬN",
  cancelText = "HỦY BỎ",
  variant = "danger", // danger, warning
  isLoading = false
}) {
  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const themes = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-100',
      gradient: 'from-red-600 to-red-400'
    },
    warning: {
      icon: ShieldAlert,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      confirmBtn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-100',
      gradient: 'from-orange-600 to-orange-400'
    },
    info: {
      icon: AlertCircle,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
      gradient: 'from-blue-600 to-blue-400'
    }
  };

  const theme = themes[variant] || themes.danger;
  const Icon = theme.icon;
  const isAlertOnly = !onConfirm;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-500 border border-white">
        {/* Decorative elements */}
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.gradient}`}></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gray-50 rounded-full blur-3xl opacity-50"></div>
        
        <div className="p-10 pt-12 text-center">
          {/* Header Icon */}
          <div className={`w-24 h-24 ${theme.iconBg} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative group`}>
             <Icon size={40} className={`${theme.iconColor} group-hover:scale-110 transition-transform duration-500`} />
             <div className="absolute inset-0 rounded-[2.5rem] border-2 border-white opacity-50"></div>
          </div>

          {/* Text Content */}
          <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none italic">
            {title}
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 leading-relaxed max-w-[280px] mx-auto whitespace-pre-line">
            {message}
          </p>

          {/* Actions */}
          <div className={`grid gap-4 ${isAlertOnly ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 ${isAlertOnly ? 'hidden' : ''}`}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm || onClose}
              disabled={isLoading}
              className={`py-5 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 hover:-translate-y-1 disabled:opacity-50 ${theme.confirmBtn} ${isAlertOnly ? 'w-full' : ''}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
