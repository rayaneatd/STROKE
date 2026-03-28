
import React from 'react';
import { X, Timer, Rocket, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
    isOpen,
    onClose
}) => {
    const { isLight, accent } = useTheme();
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-900/40' : 'bg-black/90'}`} onClick={onClose}>
            <div
                className={`rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col border p-2 ${isLight ? 'bg-white border-slate-200' : 'bg-[#121214] border-white/10'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-6 right-6">
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-zinc-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10 text-center">
                    <div className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 ${isLight ? 'bg-amber-50 border-amber-100 text-amber-500 shadow-amber-100/50 shadow-xl' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/20 shadow-2xl'}`}>
                        <Timer size={40} className="animate-pulse" />
                        <div className="absolute -top-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-[#121214] animate-bounce">
                            <Rocket size={14} className="text-white" />
                        </div>
                    </div>

                    <h2 className={`text-3xl font-black mb-4 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {t('modal.comingSoon.title', 'Coming Soon...')}
                    </h2>

                    <div className={`h-1 w-12 mx-auto rounded-full mb-6 bg-${accent}-500/30`} />

                    <p className={`text-base mb-10 leading-relaxed font-medium ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {t('modal.comingSoon.description', 'This application is currently in its test phase. Premium features and subscription management will be fully available in the next major update.')}
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl ${isLight ? `bg-${accent}-600 hover:bg-${accent}-500 shadow-${accent}-500/30` : `bg-${accent}-500 hover:bg-${accent}-400 shadow-${accent}-500/20`}`}
                        >
                            <Check size={20} strokeWidth={3} /> {t('common.gotIt', 'I Understand')}
                        </button>

                        <p className={`text-[10px] uppercase tracking-widest font-bold opacity-30 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Phase : Beta 0.4.1
                        </p>
                    </div>
                </div>

                {/* Decorative gradients */}
                {!isLight && (
                    <>
                        <div className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[60px] opacity-20 bg-${accent}-500`} />
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-20 bg-amber-500`} />
                    </>
                )}
            </div>
        </div>
    );
};

export default ComingSoonModal;
