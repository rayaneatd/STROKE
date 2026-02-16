
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  isDeleting
}) => {
  const { isLight } = useTheme();
  const { t } = useTranslation();
  const [deleteCountdown, setDeleteCountdown] = useState(10);

  useEffect(() => {
      if (isOpen) {
          setDeleteCountdown(10);
      }
  }, [isOpen]);

  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (isOpen && deleteCountdown > 0) {
          timer = setTimeout(() => {
              setDeleteCountdown(prev => prev - 1);
          }, 1000);
      }
      return () => clearTimeout(timer);
  }, [isOpen, deleteCountdown]);

  if (!isOpen) return null;

  return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`} onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
              <div className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${isLight ? 'bg-red-50 border-red-100 text-red-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('modal.deleteAccount.title')}</h3>
                  <p className={`mb-6 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {t('modal.deleteAccount.description')}
                  </p>
                  
                  {/* Countdown Indicator */}
                  {deleteCountdown > 0 && (
                      <div className="mb-6 flex justify-center">
                          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border animate-pulse ${isLight ? 'text-red-500 bg-red-50 border-red-200' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                              {t('modal.deleteAccount.wait', { count: deleteCountdown })}
                          </span>
                      </div>
                  )}

                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={onConfirm}
                          disabled={deleteCountdown > 0 || isDeleting}
                          className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                              deleteCountdown > 0 
                                  ? 'bg-zinc-500 cursor-not-allowed shadow-none opacity-50' 
                                  : 'bg-red-600 hover:bg-red-700 shadow-red-900/30'
                          }`}
                      >
                          {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                          {deleteCountdown > 0 ? t('modal.deleteAccount.pleaseWait', { count: deleteCountdown }) : t('modal.deleteAccount.confirm')}
                      </button>
                      <button 
                          onClick={onClose}
                          className={`w-full py-3.5 rounded-xl font-bold transition-colors border ${isLight ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50' : 'text-zinc-400 bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                          {t('modal.deleteAccount.cancel')}
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default DeleteAccountModal;
