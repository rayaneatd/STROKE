
import React, { useState } from 'react';
import { X, AlertCircle, BellRing, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
                  <h2 className={`text-2xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Out of Scans</h2>
                  <p className={`text-sm mb-6 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      The project owner, <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{ownerName}</span>, has no scans remaining. Only the owner can purchase more scans.
                  </p>

                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleNotify}
                        disabled={notified}
                        className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${notified ? 'bg-emerald-600' : `bg-${accent}-600 hover:bg-${accent}-500`}`}
                      >
                          {notified ? (
                              <>
                                  <Check size={20} /> Request Sent
                              </>
                          ) : (
                              <>
                                  <BellRing size={20} /> Notify Manager
                              </>
                          )}
                      </button>
                      <button 
                        onClick={onClose}
                        className={`w-full py-3.5 rounded-xl font-bold transition-colors border ${isLight ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50' : 'text-zinc-400 bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default NoScansModal;
