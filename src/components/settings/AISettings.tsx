
import React from 'react';
import { BrainCircuit, Sparkles, Quote, Sliders, Target, Cpu } from 'lucide-react';
import { UserPreferences, AIPreferences } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface AISettingsProps {
    prefs: UserPreferences;
    onAIConfigChange: (key: keyof AIPreferences, value: any) => void;
}

// --- Inline Brand Icons ---
const MercuryIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stylized Mercury / dLLM icon - parallel wave diffusion motif */}
        <circle cx="50" cy="50" r="48" fill="#0F1B2D" stroke="#1E3A5F" strokeWidth="2" />
        <path d="M18 50 Q32 30 50 50 Q68 70 82 50" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M18 38 Q32 18 50 38 Q68 58 82 38" stroke="#7DD3FC" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M18 62 Q32 42 50 62 Q68 82 82 62" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6" />
        <circle cx="50" cy="50" r="5" fill="#38BDF8" />
    </svg>
);

const MistralIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mistral "M" - modular block style matching their 2025 rebrand */}
        <rect width="100" height="100" rx="12" fill="#FF7000" />
        {/* Block-style "M" made of rectangles */}
        <rect x="14" y="20" width="18" height="60" rx="2" fill="white" />
        <rect x="14" y="20" width="54" height="18" rx="2" fill="white" />
        <rect x="41" y="20" width="18" height="42" rx="2" fill="white" />
        <rect x="14" y="38" width="36" height="18" rx="2" fill="#FF7000" />
        <rect x="68" y="20" width="18" height="60" rx="2" fill="white" />
    </svg>
);

const AI_MODELS = [
    {
        id: 'MERCURY_2' as const,
        name: 'Mercury 2',
        tagline: 'Diffusion LLM · Ultra-fast parallel generation',
        badge: 'DEFAULT',
        badgeColor: 'sky',
        Icon: MercuryIcon,
        borderColor: '#38BDF8',
        glowColor: 'rgba(56,189,248,0.15)',
    },
    {
        id: 'MISTRAL' as const,
        name: 'Mistral',
        tagline: 'Frontier open-weight · Multilingual expertise',
        badge: 'OPEN SOURCE',
        badgeColor: 'orange',
        Icon: MistralIcon,
        borderColor: '#FF7000',
        glowColor: 'rgba(255,112,0,0.15)',
    },
];

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

    const selectedModel = aiConfig.aiModel || 'MERCURY_2';

    return (
        <div className="space-y-8 animate-fade-in">

            {/* ── AI Model Selection ── */}
            <div>
                <h2 className={`text-xl font-bold mb-2 ${styles.text.primary}`}>
                    AI Model
                </h2>
                <p className={`text-sm mb-6 ${styles.text.secondary}`}>
                    Choose the AI model used to scan and analyse your candidates.
                </p>

                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${styles.text.primary}`}>
                        <Cpu size={16} /> Model Selection
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {AI_MODELS.map((model) => {
                            const isSelected = selectedModel === model.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => onAIConfigChange('aiModel', model.id)}
                                    className={`relative p-4 rounded-xl border text-left transition-all duration-200 overflow-hidden group`}
                                    style={{
                                        borderColor: isSelected ? model.borderColor : undefined,
                                        background: isSelected ? model.glowColor : undefined,
                                        boxShadow: isSelected ? `0 0 0 1px ${model.borderColor}` : undefined,
                                    }}
                                >
                                    {/* Selection ring */}
                                    {!isSelected && (
                                        <span className={`absolute inset-0 rounded-xl border ${styles.border.base} ${isLight ? 'bg-white' : 'bg-white/3'} group-hover:border-opacity-70 transition-all`} />
                                    )}

                                    <div className="relative z-10 flex items-start gap-3">
                                        {/* Brand Icon */}
                                        <div className="shrink-0 mt-0.5">
                                            <model.Icon size={36} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`font-black text-sm ${isSelected ? styles.text.primary : styles.text.primary}`}>
                                                    {model.name}
                                                </span>
                                                <span
                                                    className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                                    style={{
                                                        background: isSelected ? model.glowColor : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.07)'),
                                                        color: isSelected ? model.borderColor : undefined,
                                                    }}
                                                >
                                                    {model.badge}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] leading-relaxed ${styles.text.tertiary}`}>
                                                {model.tagline}
                                            </p>
                                        </div>

                                        {/* Check indicator */}
                                        {isSelected && (
                                            <div
                                                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                                                style={{ background: model.borderColor }}
                                            >
                                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Calibration ── */}
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
                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${aiConfig.strictness === level
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

            {/* ── Tone Settings ── */}
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
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all ${aiConfig.tone === tone
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
