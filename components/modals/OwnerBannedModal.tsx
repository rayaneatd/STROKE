
import React from 'react';
import { X, Lock, AlertOctagon, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface OwnerBannedModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerName: string;
}

const OwnerBannedModal: React.FC<OwnerBannedModalProps> = ({ 
  isOpen, 
  onClose, 
  ownerName
}) => {
  const { isLight } = useTheme();

  if (!isOpen) return null;

  return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/80'}`} onClick={e => e.stopPropagation()}>
          <div 
            className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col border border-red-500/20 ${isLight ? 'bg-white' : 'bg-[#18181b]'}`} 
            onClick={e => e.stopPropagation()}
          >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
              
              <div className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-4 ${isLight ? 'bg-red-50 border-red-100 text-red-500' : 'bg-red-500/10 border-red-500/10 text-red-500'}`}>
                      <Lock size={32} />
                  </div>
                  <h2 className={`text-2xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Project Suspended</h2>
                  
                  <div className={`rounded-xl p-4 mb-6 border ${isLight ? 'bg-red-50 border-red-100' : 'bg-red-500/10 border-red-500/20'}`}>
                      <p className={`text-sm font-medium leading-relaxed flex items-start gap-3 text-left ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                          <AlertOctagon size={20} className="shrink-0 mt-0.5" />
                          <span>
                              This project is temporarily inaccessible because the project owner, <strong className={`font-bold ${isLight ? 'text-red-800' : 'text-red-300'}`}>{ownerName}</strong>, has had their account suspended.
                          </span>
                      </p>
                  </div>

                  <p className={`text-sm mb-8 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                      You cannot access files, discussions, or team settings for this project until the owner's status is resolved.
                  </p>

                  <button 
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl font-bold transition-all shadow-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                  >
                      <ArrowLeft size={18} /> Return to Dashboard
                  </button>
              </div>
          </div>
      </div>
  );
};

export default OwnerBannedModal;
