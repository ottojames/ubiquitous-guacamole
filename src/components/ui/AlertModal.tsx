import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

const variantStyles = {
  success: {
    icon: 'bg-emerald-100 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    IconComponent: CheckCircle,
  },
  error: {
    icon: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    IconComponent: AlertTriangle,
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    IconComponent: AlertTriangle,
  },
  info: {
    icon: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    IconComponent: Info,
  },
};

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
  variant = 'info',
}: AlertModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];
  const IconComponent = styles.IconComponent;

  // Focus button when modal opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      aria-describedby="alert-modal-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.icon}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <h2 id="alert-modal-title" className="text-xl font-bold text-slate-900">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p id="alert-modal-description" className="text-slate-600 mt-4">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-slate-200">
          <button
            ref={buttonRef}
            onClick={onClose}
            className={`px-6 py-2 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;
