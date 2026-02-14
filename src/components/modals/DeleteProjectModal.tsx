
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  onConfirm: () => void;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  projectTitle, 
  onConfirm 
}) => {
  const { isLight } = useTheme();

  if (!isOpen) return null;

  return (
      <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`} onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isLight ? 'bg-red-50 border-red-100 text-red-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Delete Project?</h3>
                  <p className={`mb-6 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Are you sure you want to delete <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>"{projectTitle}"</span>?
                      <br/>
                      <span className="text-red-500 font-bold text-xs uppercase tracking-wide mt-2 block">
                          This action cannot be undone.
                      </span>
                  </p>
                  <div className="flex gap-3 justify-center">
                      <button 
                        onClick={onClose}
                        className={`px-6 py-3 rounded-xl font-bold transition-colors border ${isLight ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50' : 'text-zinc-400 bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={onConfirm}
                        className="px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 transition-colors flex items-center gap-2"
                      >
                          <Trash2 size={18} /> Delete Project
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default DeleteProjectModal;
