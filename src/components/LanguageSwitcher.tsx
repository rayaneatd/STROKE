import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const LanguageSwitcher: React.FC = () => {
    const { i18n, t } = useTranslation();
    const { isLight, accent } = useTheme();
    const { user } = useAuth();

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' }
    ];

    const changeLanguage = async (lng: string) => {
        // 1. Change i18n state
        await i18n.changeLanguage(lng);
        
        // 2. Persist to Supabase if logged in
        if (user) {
            await supabase
                .from('profiles')
                .update({ language: lng })
                .eq('id', user.id);
        }
    };

    const cardClass = isLight 
        ? 'bg-white border-slate-200' 
        : 'bg-[#18181b] border-white/5';
        
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    return (
        <div className={`p-5 rounded-2xl border ${cardClass} animate-fade-in`}>
            <div className="flex items-center gap-2 mb-4">
                <Globe size={18} className={isLight ? 'text-slate-400' : 'text-zinc-500'} />
                <h3 className={`text-sm font-bold ${textPrimary}`}>{t('settings.language')}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {languages.map((lang) => {
                    const isActive = i18n.language === lang.code;
                    return (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                isActive
                                    ? `bg-${accent}-500/10 border-${accent}-500 ring-1 ring-${accent}-500/50`
                                    : isLight 
                                        ? 'bg-white border-slate-200 hover:bg-slate-50' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{lang.flag}</span>
                                <span className={`text-sm font-bold ${isActive ? `text-${accent}-500` : textPrimary}`}>
                                    {lang.label}
                                </span>
                            </div>
                            {isActive && (
                                <div className={`p-1 rounded-full bg-${accent}-500 text-white`}>
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
