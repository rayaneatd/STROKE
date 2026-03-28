import React, { useState } from 'react';
import { Target, Sparkles, RefreshCcw, Save, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Project, ScoringWeights } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ScoringCalibrationProps {
    project: Project;
    onUpdate: (newConfig: any) => void;
}

const ScoringCalibration: React.FC<ScoringCalibrationProps> = ({ project, onUpdate }) => {
    const { t } = useTranslation();
    const { styles, isLight } = useTheme();
    const [weights, setWeights] = useState<ScoringWeights>(
        project.scoringConfig?.weights || {
            technical_skills: 40,
            experience: 30,
            education: 15,
            soft_skills: 15,
        }
    );
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [justification, setJustification] = useState<string | null>(
        project.scoringConfig?.calibrationJustification || null
    );

    const total = weights.technical_skills + weights.experience + weights.education + weights.soft_skills;
    const isValid = total === 100;

    const handleWeightChange = (key: keyof ScoringWeights, value: number) => {
        setWeights(prev => ({ ...prev, [key]: value }));
    };

    const calibrateWithAI = async () => {
        setIsCalibrating(true);
        try {
            const { data, error } = await supabase.functions.invoke('calibrate_scoring', {
                body: { project_id: project.id }
            });
            if (error) throw error;

            if (data.weights) {
                setWeights(data.weights);
                setJustification(data.justification);
            }
        } catch (err) {
            console.error('Calibration failed:', err);
        } finally {
            setIsCalibrating(false);
        }
    };

    const saveConfig = async () => {
        if (!isValid) return;
        setIsSaving(true);
        try {
            const newConfig = {
                weights,
                calibrationJustification: justification,
                lastCalibratedAt: new Date().toISOString()
            };

            const { error } = await supabase
                .from('projects')
                .update({ scoring_config: newConfig })
                .eq('id', project.id);

            if (error) throw error;
            onUpdate(newConfig);
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const colors = {
        technical_skills: 'text-blue-500 bg-blue-500/10',
        experience: 'text-emerald-500 bg-emerald-500/10',
        education: 'text-purple-500 bg-purple-500/10',
        soft_skills: 'text-amber-500 bg-amber-500/10',
    };

    return (
        <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base} space-y-6 shadow-sm`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${styles.text.primary}`}>
                        <Target className="text-emerald-500" size={20} />
                        {t('project.settings.scoring.title', 'Scoring Calibration')}
                    </h3>
                    <p className={`text-xs ${styles.text.secondary} mt-1`}>
                        {t('project.settings.scoring.desc', 'Define how candidates are ranked relative to your Job Description.')}
                    </p>
                </div>
                <button
                    onClick={calibrateWithAI}
                    disabled={isCalibrating}
                    className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50`}
                >
                    {isCalibrating ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isCalibrating ? 'Analyzing JD...' : 'AI Calibration'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-6">
                    {(Object.keys(weights) as Array<keyof ScoringWeights>).map((key) => (
                        <div key={key} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className={`text-[10px] uppercase font-bold tracking-wider ${styles.text.tertiary}`}>
                                    {t(`project.settings.scoring.${key}`, key.replace('_', ' '))}
                                </label>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[key]}`}>
                                    {weights[key]}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={weights[key]}
                                onChange={(e) => handleWeightChange(key, parseInt(e.target.value))}
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                    ))}

                    <div className={`p-4 rounded-xl border flex items-center justify-between ${isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                        <div className="flex items-center gap-2">
                            {isValid ? <AlertCircle className="text-emerald-500" size={16} /> : <AlertCircle className="text-rose-500" size={16} />}
                            <span className={`text-xs font-bold ${isValid ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isValid ? 'Total valid: 100%' : `Total invalid: ${total}% (Must be 100)`}
                            </span>
                        </div>
                        <button
                            onClick={saveConfig}
                            disabled={!isValid || isSaving}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${isValid ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            {isSaving ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                            {t('common.save', 'Save Config')}
                        </button>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border ${isLight ? 'bg-slate-50' : 'bg-black/20'} ${styles.border.base} flex flex-col`}>
                    <h4 className={`text-[10px] uppercase font-bold tracking-wider ${styles.text.tertiary} mb-4 flex items-center gap-2`}>
                        <Info size={12} />
                        {t('project.settings.scoring.justification', 'Calibration Insights')}
                    </h4>
                    {justification ? (
                        <div className={`text-sm leading-relaxed ${styles.text.secondary} animate-fade-in`}>
                            {justification}
                        </div>
                    ) : (
                        <div className={`flex-1 flex flex-col items-center justify-center text-center p-4 opacity-40`}>
                            <Sparkles size={32} className="mb-3 text-zinc-700" />
                            <p className="text-xs italic">{t('project.settings.scoring.placeholder', 'Calibrating with AI will provide insights into why these weights are optimal for your JD.')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScoringCalibration;
