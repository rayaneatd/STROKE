
import React from 'react';
import { Gavel, LogOut, Lock, AlertOctagon } from 'lucide-react';
import { User } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface GlobalBanModalProps {
    user: User;
    onLogout: () => void;
}

const GlobalBanModal: React.FC<GlobalBanModalProps> = ({ user, onLogout }) => {
    const { isLight } = useTheme();

    // Force Dark styling for severe alerts or adapt to theme
    const bgClass = isLight ? 'bg-slate-50' : 'bg-[#050505]';
    const cardBg = isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#18181b] border-white/10 shadow-2xl';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-400';

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 animate-fade-in`}>
            <div className={`w-full max-w-md rounded-3xl overflow-hidden flex flex-col items-center text-center p-8 border ${cardBg}`}>
                
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/20">
                    <Gavel size={40} className="text-red-500" />
                </div>

                <h1 className={`text-2xl font-black mb-2 ${textPrimary}`}>Account Suspended</h1>
                
                <p className={`text-sm mb-6 leading-relaxed ${textSecondary}`}>
                    Your account has been suspended by an administrator. You no longer have access to the AIRecruit platform or your projects.
                </p>

                {(user.banReason || user.banExpiresAt) && (
                    <div className={`w-full p-4 rounded-xl border mb-8 text-left ${isLight ? 'bg-red-50 border-red-100' : 'bg-red-500/5 border-red-500/20'}`}>
                        {user.banReason && (
                            <div className="mb-2 last:mb-0">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Reason</span>
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{user.banReason}</span>
                            </div>
                        )}
                        {user.banExpiresAt && (
                            <div className="mt-3 pt-3 border-t border-red-500/10">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Expiration</span>
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                    {new Date(user.banExpiresAt).toLocaleDateString()} at {new Date(user.banExpiresAt).toLocaleTimeString()}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="w-full space-y-3">
                    <button 
                        onClick={onLogout}
                        className="w-full py-3.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Sign Out Safely
                    </button>
                    
                    <p className={`text-[10px] ${textSecondary}`}>
                        If you believe this is an error, please contact support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GlobalBanModal;
