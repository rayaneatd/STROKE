
import React from 'react';
import { Gavel, LogOut, Lock, AlertOctagon } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { User } from '../../types';
import { useTheme } from '../../context/ThemeContext';

import Logo from '../ui/Logo';

interface GlobalBanModalProps {
    user: User;
    onLogout: () => void;
}

const GlobalBanModal: React.FC<GlobalBanModalProps> = ({ user, onLogout }) => {
    const { isLight } = useTheme();
    const { t } = useTranslation();

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

                <h1 className={`text-2xl font-black mb-2 ${textPrimary}`}>{t('modal.globalBan.title')}</h1>
                
                <p className={`text-sm mb-6 leading-relaxed ${textSecondary}`}>
                    <Trans
                        i18nKey="modal.globalBan.description"
                        components={{ 1: <Logo variant="text" height={14} className="inline-block align-middle mx-1" /> }}
                    />
                </p>

                {(user.banReason || user.banExpiresAt) && (
                    <div className={`w-full p-4 rounded-xl border mb-8 text-left ${isLight ? 'bg-red-50 border-red-100' : 'bg-red-500/5 border-red-500/20'}`}>
                        {user.banReason && (
                            <div className="mb-2 last:mb-0">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">{t('modal.globalBan.reason')}</span>
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{user.banReason}</span>
                            </div>
                        )}
                        {user.banExpiresAt && (
                            <div className="mt-3 pt-3 border-t border-red-500/10">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">{t('modal.globalBan.expiration')}</span>
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
                        <LogOut size={18} /> {t('modal.globalBan.signOut')}
                    </button>
                    
                    <p className={`text-[10px] ${textSecondary}`}>
                        {t('modal.globalBan.contactSupport')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GlobalBanModal;
