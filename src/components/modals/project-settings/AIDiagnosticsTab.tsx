
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, Loader2, Sparkles, Activity, ChevronRight, Check, TrendingUp, Users, Calculator } from 'lucide-react';
import { CalibrationResult } from '../../../services/aiCalibrationEngine';
import { Project, ProjectBillingMode } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface AIDiagnosticsTabProps {
    mode: 'CREATE' | 'EDIT';
    isAnalyzing: boolean;
    analysisStep: string;
    analysisResult: CalibrationResult | null;
    handleRunDiagnostics: () => void;
    applyOptimization: () => void;
    projectConfig: Partial<Project>;
    setAnalysisResult: (res: CalibrationResult | null) => void;
    onApplySimulation?: (budget: number, quota: number | 'UNLIMITED', billingMode: ProjectBillingMode) => void;
}

const AIDiagnosticsTab: React.FC<AIDiagnosticsTabProps> = ({ 
    mode,
    isAnalyzing, 
    analysisStep, 
    analysisResult, 
    handleRunDiagnostics, 
    applyOptimization,
    projectConfig,
    setAnalysisResult,
    onApplySimulation
}) => {
    const { t } = useTranslation();
    const { isLight, accent } = useTheme();
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    // SMOKED GLASS STYLE
    const glassCardClass = isLight 
        ? 'bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        : 'bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]';

    return (
        <div className="space-y-8 animate-fade-in h-full flex flex-col">
            <div>
                <h2 className="text-xl font-bold text-indigo-400 mb-2 flex items-center gap-2">
                    <BrainCircuit size={20} className="text-indigo-500"/> {t('modal.ai.title')}
                </h2>
                <p className={`text-sm mb-6 ${textSecondary}`}>
                    {t('modal.ai.description')}
                </p>
                
                {!analysisResult ? (
                    <div className={`rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px] ${glassCardClass}`}>
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-indigo-500/20 shadow-lg">
                            {isAnalyzing ? <Loader2 size={40} className="animate-spin text-indigo-400"/> : <Sparkles size={40} className="text-indigo-400" />}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${textPrimary}`}>{isAnalyzing ? t('modal.ai.running') : t('modal.ai.ready')}</h3>
                        <p className="text-zinc-400 text-sm max-w-sm mb-8 min-h-[20px]">
                            {isAnalyzing ? analysisStep : t('modal.ai.intro')}
                        </p>
                        <button 
                            onClick={handleRunDiagnostics} 
                            disabled={isAnalyzing} 
                            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isAnalyzing ? <Activity size={18} className="animate-pulse" /> : <Activity size={18} />}
                            {isAnalyzing ? t('modal.ai.processing') : t('modal.ai.run')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex items-stretch gap-4">
                            <div className={`border rounded-2xl p-6 flex flex-col justify-between min-w-[140px] ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`}>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('modal.ai.healthScore')}</div>
                                <div className={`text-4xl font-black ${analysisResult.healthScore > 80 ? 'text-emerald-500' : analysisResult.healthScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>{analysisResult.healthScore}</div>
                            </div>
                            <div className={`flex-1 border rounded-2xl p-6 flex flex-col justify-center gap-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`}>
                                <div className={`flex justify-between items-center text-sm border-b pb-2 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                    <span className="text-zinc-400">{t('modal.ai.dailyScans')}</span>
                                    <span className={`font-bold ${textPrimary}`}>{analysisResult.metrics.dailyVelocity}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">{t('modal.ai.projectedMonthly')}</span>
                                    <span className="font-bold text-indigo-400">{analysisResult.metrics.projectedMonthlyUsage}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden`}>
                            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                <div className={`rounded-xl p-4 border border-indigo-500/30 ${isLight ? 'bg-white/80' : 'bg-black/40'}`}>
                                    <div className="text-[10px] text-indigo-400 font-bold uppercase mb-2">{t('modal.ai.projectBudget')}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="opacity-60 text-sm line-through decoration-zinc-500 text-zinc-500">{projectConfig.investmentBalance || 0}</div>
                                        <ChevronRight size={14} className="text-indigo-400" />
                                        <div className="text-lg font-black text-indigo-300">{analysisResult.recommendations.budget}</div>
                                    </div>
                                </div>
                                <div className={`rounded-xl p-4 border border-indigo-500/30 ${isLight ? 'bg-white/80' : 'bg-black/40'}`}>
                                    <div className="text-[10px] text-indigo-400 font-bold uppercase mb-2">{t('modal.ai.memberQuota')}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="opacity-60 text-sm line-through decoration-zinc-500 text-zinc-500">{projectConfig.settings?.defaultScanQuota === 'UNLIMITED' ? '∞' : projectConfig.settings?.defaultScanQuota}</div>
                                        <ChevronRight size={14} className="text-indigo-400" />
                                        <div className="text-lg font-black text-indigo-300">{analysisResult.recommendations.quota === 'UNLIMITED' ? '∞' : analysisResult.recommendations.quota}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end relative z-10">
                                <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 bg-transparent text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors">{t('modal.ai.dismiss')}</button>
                                <button onClick={applyOptimization} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-indigo-500 transition-colors flex items-center gap-2"><Check size={14} strokeWidth={3} /> {t('modal.ai.approve')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIDiagnosticsTab;
