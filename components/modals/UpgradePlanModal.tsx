
import React from 'react';
import { X, Zap, Check, Star, Sparkles, Crown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpgrade 
}) => {
  const { isLight, accent } = useTheme();

  if (!isOpen) return null;

  return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/80'}`} onClick={onClose}>
          <div 
            className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col transform transition-all scale-100 border ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`} 
            onClick={e => e.stopPropagation()}
          >
              {/* Decorative Background Header */}
              <div className="h-32 bg-gradient-to-br from-indigo-900 via-purple-900 to-brand-900 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex justify-center items-center">
                      <Sparkles className="text-white/10 w-48 h-48 absolute animate-pulse" />
                      <div className="bg-white/5 backdrop-blur-md p-4 rounded-full border border-white/10 shadow-xl relative z-10">
                          <Crown size={40} className="text-yellow-400 fill-yellow-400 drop-shadow-md" />
                      </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                  >
                      <X size={18} />
                  </button>
              </div>

              {/* Content */}
              <div className="px-8 pt-8 pb-8 text-center">
                  <h2 className={`text-2xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Unlock Unlimited Potential</h2>
                  <p className={`text-sm mb-8 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      You've run out of scans! Upgrade to <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">AIRecruit Pro</span> to remove limits and hire faster.
                  </p>

                  <div className="space-y-3 mb-8 text-left">
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                          <div className="p-1.5 bg-green-500/20 text-green-500 rounded-full">
                              <Check size={14} strokeWidth={3} />
                          </div>
                          <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Unlimited Resume Scans</span>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                          <div className="p-1.5 bg-green-500/20 text-green-500 rounded-full">
                              <Check size={14} strokeWidth={3} />
                          </div>
                          <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Advanced AI Analysis</span>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                          <div className="p-1.5 bg-green-500/20 text-green-500 rounded-full">
                              <Check size={14} strokeWidth={3} />
                          </div>
                          <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Priority Processing Queue</span>
                      </div>
                  </div>

                  <button 
                    onClick={onUpgrade}
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden ${isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-zinc-200'}`}
                  >
                      <span className="relative flex items-center gap-2">
                          <Zap size={20} className="fill-current text-amber-500" /> Upgrade Now
                      </span>
                  </button>
                  
                  <button 
                    onClick={onClose}
                    className={`mt-4 text-xs font-bold transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-white'}`}
                  >
                      Maybe Later
                  </button>
              </div>
          </div>
      </div>
  );
};

export default UpgradePlanModal;
