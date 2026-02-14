
import React from 'react';
import { X, Lock, Archive, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ProjectLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'COMPLETED' | 'ARCHIVED';
}

const ProjectLockedModal: React.FC<ProjectLockedModalProps> = ({ 
  isOpen, 
  onClose, 
  status 
}) => {
  const { isLight } = useTheme();

  if (!isOpen) return null;

  const isArchived = status === 'ARCHIVED';

  return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/80'}`} onClick={onClose}>
          <div 
            className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col border ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`} 
            onClick={e => e.stopPropagation()}
          >
              <div className={`p-8 text-center border-t-4 ${isArchived ? (isLight ? 'border-slate-400' : 'border-zinc-500') : 'border-emerald-500'}`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 ${
                      isArchived 
                      ? (isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500') 
                      : (isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500')
                  }`}>
                      {isArchived ? <Archive size={36} /> : <CheckCircle size={36} />}
                  </div>
                  <h2 className={`text-2xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Project is {isArchived ? 'Archived' : 'Completed'}
                  </h2>
                  <p className={`text-sm mb-8 leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      This project is in <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Read-Only mode</span>. 
                      <br/>
                      You can view details, files, and analytics, but you cannot perform actions like scanning resumes, adding members, or editing details.
                  </p>

                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={onClose}
                        className={`w-full py-3.5 rounded-xl font-bold transition-colors shadow-lg border ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' : 'bg-white/10 text-white hover:bg-white/20 border-white/5'}`}
                      >
                          Understood
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default ProjectLockedModal;
