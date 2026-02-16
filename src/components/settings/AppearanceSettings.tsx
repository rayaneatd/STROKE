
import React from 'react';
import { Palette, Sun, Moon, Lock, Layers, MousePointer2 } from 'lucide-react';
import { UserPreferences, UIPreferences, SubscriptionPlan } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ACCENT_PALETTES } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface AppearanceSettingsProps {
    prefs: UserPreferences;
    onUIConfigChange: (key: keyof UIPreferences, value: any) => void;
    userSubscription: SubscriptionPlan;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ prefs, onUIConfigChange, userSubscription }) => {
    const { t } = useTranslation();
    const { styles, accent, isLight } = useTheme();

    // --- THEME HIERARCHY LOGIC ---
    const PLAN_LEVELS: Record<SubscriptionPlan, number> = {
        [SubscriptionPlan.FREE]: 0,
        [SubscriptionPlan.ESSENTIAL]: 1,
        [SubscriptionPlan.PRO]: 2,
        [SubscriptionPlan.TEAM]: 3,
        [SubscriptionPlan.ELITE]: 4
    };

    // Map specific colors to the minimum plan required to use them
    const UNLOCK_REQUIREMENTS: Record<string, SubscriptionPlan> = {
        'slate': SubscriptionPlan.FREE,
        'emerald': SubscriptionPlan.ESSENTIAL,
        'blue': SubscriptionPlan.PRO,
        'cyan': SubscriptionPlan.PRO,
        'violet': SubscriptionPlan.TEAM,
        'rose': SubscriptionPlan.TEAM,
        'amber': SubscriptionPlan.ELITE,
    };

    // Explicit order for display to match plan progression
    // Slate (Free) -> Emerald (Essential) -> Blue (Pro) -> Cyan (Pro) -> Violet (Team) -> Rose (Team) -> Amber (Elite)
    const DISPLAY_ORDER: string[] = ['slate', 'emerald', 'blue', 'cyan', 'violet', 'rose', 'amber'];

    const isUnlocked = (colorId: string) => {
        const requiredPlan = UNLOCK_REQUIREMENTS[colorId];
        return PLAN_LEVELS[userSubscription] >= PLAN_LEVELS[requiredPlan];
    };

    const getPlanBadge = (colorId: string) => {
        const plan = UNLOCK_REQUIREMENTS[colorId];
        if (plan === SubscriptionPlan.FREE) return null;

        let badgeClasses = 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10';
        
        switch (plan) {
            case SubscriptionPlan.ESSENTIAL:
                badgeClasses = 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
                break;
            case SubscriptionPlan.PRO:
                badgeClasses = 'text-blue-500 border-blue-500/20 bg-blue-500/10';
                break;
            case SubscriptionPlan.TEAM:
                badgeClasses = 'text-violet-500 border-violet-500/20 bg-violet-500/10';
                break;
            case SubscriptionPlan.ELITE:
                badgeClasses = 'text-amber-500 border-amber-500/20 bg-amber-500/10';
                break;
        }

        return (
            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border backdrop-blur-md shadow-sm ${badgeClasses}`}>
                {plan}
            </span>
        );
    };

    // Reusable Switch Component
    const Switch = ({ checked, onChange, accentColor }: { checked: boolean; onChange: () => void; accentColor: string }) => (
        <button 
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${checked ? `bg-${accentColor}-600` : 'bg-zinc-600/50'}`}
        >
            <span
                className={`${
                    checked ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm`}
            />
        </button>
    );

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Theme Mode */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>{t('settings.appearance.title')}</h2>
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                    <button 
                        onClick={() => onUIConfigChange('theme', 'DARK')}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${prefs.uiConfig?.theme === 'DARK' ? 'bg-zinc-800 border-white text-white shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                    >
                        <Moon size={24} className={prefs.uiConfig?.theme === 'DARK' ? 'text-purple-400' : ''} />
                        <span className="text-sm font-bold">{t('settings.appearance.darkMode')}</span>
                    </button>
                    <button 
                        onClick={() => onUIConfigChange('theme', 'LIGHT')}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${prefs.uiConfig?.theme === 'LIGHT' ? 'bg-white border-slate-300 text-slate-900 shadow-lg' : 'bg-white/5 border-white/10 text-zinc-500'}`}
                    >
                        <Sun size={24} className={prefs.uiConfig?.theme === 'LIGHT' ? 'text-amber-500' : ''} />
                        <span className="text-sm font-bold">{t('settings.appearance.lightMode')}</span>
                    </button>
                </div>
            </div>

            {/* Accent Color Selection */}
            <div>
                <h2 className={`text-xl font-bold mb-2 ${styles.text.primary}`}>{t('settings.appearance.accentColor')}</h2>
                <p className={`text-sm mb-4 ${styles.text.secondary}`}>{t('settings.appearance.accentDescription')}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {DISPLAY_ORDER.map(colorKey => {
                        const colorId = colorKey as any;
                        const unlocked = isUnlocked(colorId);
                        const isActive = accent === colorId;
                        const bgPreview = `bg-${ACCENT_PALETTES[colorId][500]}`;
                        
                        return (
                            <button
                                key={colorId}
                                onClick={() => unlocked && onUIConfigChange('accentColor', colorId)}
                                disabled={!unlocked}
                                className={`relative group p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 overflow-hidden ${
                                    isActive 
                                    ? `bg-white/10 border-white/20 ring-2 ring-${ACCENT_PALETTES[colorId][500]} ${isLight ? 'ring-offset-white' : 'ring-offset-[#0e0e10]'} ring-offset-2`
                                    : unlocked 
                                        ? styles.bg.surfaceHover 
                                        : 'opacity-60 cursor-not-allowed bg-white/[0.02]'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full ${bgPreview} shadow-lg ${!unlocked && 'grayscale'}`}></div>
                                <span className={`text-[10px] font-bold capitalize ${isActive ? styles.text.primary : styles.text.tertiary}`}>{colorId}</span>
                                
                                {!unlocked && (
                                    <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[1.5px] gap-1.5 ${isLight ? 'bg-white/40' : 'bg-black/60'}`}>
                                        <Lock size={14} className={isLight ? 'text-slate-600' : 'text-white'} />
                                        {getPlanBadge(colorId)}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Ambient Glow Selection */}
            <div>
                <h2 className={`text-xl font-bold mb-2 ${styles.text.primary}`}>{t('settings.appearance.atmosphere')}</h2>
                <p className={`text-sm mb-4 ${styles.text.secondary}`}>{t('settings.appearance.atmosphereDescription')}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {DISPLAY_ORDER.map(colorKey => {
                        const colorId = colorKey as any;
                        const unlocked = isUnlocked(colorId);
                        const isActive = prefs.uiConfig?.ambientGlow === colorId;
                        const bgPreview = `bg-${ACCENT_PALETTES[colorId][500]}`;

                        return (
                            <button
                                key={colorId}
                                onClick={() => unlocked && onUIConfigChange('ambientGlow', colorId)}
                                disabled={!unlocked}
                                className={`relative group p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 overflow-hidden ${
                                    isActive 
                                    ? `bg-white/10 border-white/20 ring-2 ring-${ACCENT_PALETTES[colorId][500]} ${isLight ? 'ring-offset-white' : 'ring-offset-[#0e0e10]'} ring-offset-2`
                                    : unlocked ? styles.bg.surfaceHover : 'opacity-60'
                                }`}
                            >
                                <div className={`w-full h-8 rounded-lg ${bgPreview} opacity-50 blur-md ${!unlocked && 'grayscale'}`}></div>
                                <span className={`text-[10px] font-bold capitalize ${isActive ? styles.text.primary : styles.text.tertiary}`}>{colorId}</span>
                                {!unlocked && (
                                    <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[1.5px] gap-1.5 ${isLight ? 'bg-white/40' : 'bg-black/60'}`}>
                                        <Lock size={14} className={isLight ? 'text-slate-600' : 'text-white'} />
                                        {getPlanBadge(colorId)}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Graphical Options */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>{t('settings.appearance.graphics.title')}</h2>
                <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${styles.bg.card} ${styles.text.secondary}`}><Layers size={18}/></div>
                            <div>
                                <h3 className={`font-bold text-sm ${styles.text.primary}`}>{t('settings.appearance.graphics.glass.title')}</h3>
                                <p className={`text-xs ${styles.text.secondary}`}>{t('settings.appearance.graphics.glass.description')}</p>
                            </div>
                        </div>
                        <div className={`flex gap-1 p-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5'}`}>
                            {['LOW', 'MEDIUM', 'HIGH'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => onUIConfigChange('glassIntensity', level)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${prefs.uiConfig?.glassIntensity === level ? 'bg-white text-black shadow-sm' : styles.text.secondary}`}
                                >
                                    {t(`settings.appearance.levels.${level.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${styles.bg.card} ${styles.text.secondary}`}><MousePointer2 size={18}/></div>
                            <div>
                                <h3 className={`font-bold text-sm ${styles.text.primary}`}>{t('settings.appearance.graphics.motion.title')}</h3>
                                <p className={`text-xs ${styles.text.secondary}`}>{t('settings.appearance.graphics.motion.description')}</p>
                            </div>
                        </div>
                        <Switch checked={!!prefs.uiConfig?.reducedMotion} onChange={() => onUIConfigChange('reducedMotion', !prefs.uiConfig?.reducedMotion)} accentColor={accent} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;
