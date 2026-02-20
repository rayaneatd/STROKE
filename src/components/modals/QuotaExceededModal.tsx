
import React from 'react';
import { X, Lock, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  quota: number;
  used: number;
}

const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({ 
  isOpen, 
  onClose,
  quota,
  used
}) => {
  const { isLight } = useTheme();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/80'}`} onClick={onClose}>
          <div 
            className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col border ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`} 
            onClick={e => e.stopPropagation()}
          >
              <div className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${isLight ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                      <Lock size={32} />
                  </div>
                  <h2 className={`text-2xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('modal.quotaExceeded.title')}</h2>
                  <p className={`text-sm mb-6 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {t('modal.quotaExceeded.description', { quota, used })}
                  </p>

                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={onClose}
                        className={`w-full py-3.5 rounded-xl font-bold transition-colors border ${isLight ? 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100' : 'text-zinc-300 bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                          {t('common.close')}
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default QuotaExceededModal;
