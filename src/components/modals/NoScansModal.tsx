
import React, { useState } from 'react';
import { X, AlertCircle, BellRing, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface NoScansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotifyOwner: () => void;
  ownerName: string;
}

const NoScansModal: React.FC<NoScansModalProps> = ({ 
  isOpen, 
  onClose, 
  onNotifyOwner,
  ownerName
}) => {
  const { isLight, accent } = useTheme();
  const { t } = useTranslation();
  const [notified, setNotified] = useState(false);

  if (!isOpen) return null;

  const handleNotify = () => {
      onNotifyOwner();
      setNotified(true);
  };

  return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/80'}`} onClick={onClose}>
          <div 
            className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col border ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`} 
            onClick={e => e.stopPropagation()}
          >
              <div className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${isLight ? 'bg-red-50 border-red-100 text-red-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      <AlertCircle size={32} />
                  </div>
                  <h2 className={`text-2xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('modal.noScans.title')}</h2>
                  <p className={`text-sm mb-6 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {t('modal.noScans.description', { ownerName })}
                  </p>

                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleNotify}
                        disabled={notified}
                        className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${notified ? 'bg-emerald-600' : `bg-${accent}-600 hover:bg-${accent}-500`}`}
                      >
                          {notified ? (
                              <>
                                  <Check size={20} /> {t('modal.noScans.requestSent')}
                              </>
                          ) : (
                              <>
                                  <BellRing size={20} /> {t('modal.noScans.notifyManager')}
                              </>
                          )}
                      </button>
                      <button 
                        onClick={onClose}
                        className={`w-full py-3.5 rounded-xl font-bold transition-colors border ${isLight ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50' : 'text-zinc-400 bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                          {t('common.close')}
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default NoScansModal;
