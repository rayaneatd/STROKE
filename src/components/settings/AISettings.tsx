
import React from 'react';
import { BrainCircuit, Sparkles, Quote, Sliders, Target } from 'lucide-react';
import { UserPreferences, AIPreferences } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface AISettingsProps {
    prefs: UserPreferences;
    onAIConfigChange: (key: keyof AIPreferences, value: any) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ prefs, onAIConfigChange }) => {
    const { t } = useTranslation();
    const { styles, accent, isLight } = useTheme();
    const { aiConfig } = prefs;

    const TONE_EXAMPLES = {
        'PROFESSIONAL': t('settings.ai.personality.example.professional'),
        'CASUAL': t('settings.ai.personality.example.casual'),
        'DIRECT': t('settings.ai.personality.example.direct')
    };

    if (!aiConfig) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className={`text-xl font-bold mb-2 ${styles.text.primary}`}>{t('settings.ai.calibration.title')}</h2>
                <p className={`text-sm mb-6 ${styles.text.secondary}`}>{t('settings.ai.calibration.description')}</p>

                {/* Strictness Settings */}
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${styles.text.primary}`}>
                        <Target size={16} /> {t('settings.ai.calibration.strictness.title')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
                            <button
                                key={level}
                                onClick={() => onAIConfigChange('strictness', level)}
                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                    aiConfig.strictness === level 
                                    ? `border-${accent}-500/50 bg-${accent}-500/10 shadow-md ring-1 ring-${accent}-500/50` 
                                    : `${styles.bg.card} ${styles.border.base} hover:border-opacity-50`
                                }`}
                            >
                                <div className="relative z-10">
                                    <div className={`text-xs font-black uppercase tracking-widest mb-1 ${aiConfig.strictness === level ? `text-${accent}-500` : styles.text.secondary}`}>
                                        {level === 'LOW' ? t('settings.ai.calibration.strictness.low.label') : level === 'MEDIUM' ? t('settings.ai.calibration.strictness.medium.label') : t('settings.ai.calibration.strictness.high.label')}
                                    </div>
                                    <div className={`text-[10px] leading-tight ${styles.text.tertiary}`}>
                                        {level === 'LOW' ? t('settings.ai.calibration.strictness.low.description') : level === 'MEDIUM' ? t('settings.ai.calibration.strictness.medium.description') : t('settings.ai.calibration.strictness.high.description')}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tone Settings */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>{t('settings.ai.personality.title')}</h2>
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${styles.text.primary}`}>
                        <Sliders size={16} /> {t('settings.ai.personality.tone.title')}
                    </h3>
                    <div className="flex gap-2">
                        {['PROFESSIONAL', 'CASUAL', 'DIRECT'].map((tone) => (
                            <button
                                key={tone}
                                onClick={() => onAIConfigChange('tone', tone)}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                                    aiConfig.tone === tone 
                                    ? (isLight ? 'bg-white text-black border-slate-300 shadow-md' : 'bg-white text-black border-white shadow-lg') 
                                    : `${styles.bg.card} ${styles.text.secondary} ${styles.border.base}`
                                }`}
                            >
                                {tone === 'PROFESSIONAL' && t('settings.ai.personality.tone.professional')}
                                {tone === 'CASUAL' && t('settings.ai.personality.tone.casual')}
                                {tone === 'DIRECT' && t('settings.ai.personality.tone.direct')}
                            </button>
                        ))}
                    </div>
                    
                    {/* Dynamic Example Card */}
                    <div className={`mt-6 p-4 rounded-xl border flex gap-3 animate-fade-in relative overflow-hidden ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <div className={`absolute top-0 left-0 w-1 h-full bg-${accent}-500`}></div>
                        <Quote size={20} className={`${styles.text.secondary} shrink-0`} />
                        <div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${styles.text.secondary}`}>
                                {t('settings.ai.personality.example.title')}
                            </div>
                            <p className={`text-sm font-medium italic leading-relaxed ${styles.text.primary}`}>
                                "{TONE_EXAMPLES[aiConfig.tone as keyof typeof TONE_EXAMPLES]}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AISettings;
