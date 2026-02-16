
import React from 'react';
import {
    Layout, Users, Save, Loader2, Wallet, BrainCircuit, Rocket, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project, User } from '../../types';
import { useEditProjectModal } from '../../hooks/useEditProjectModal';

// Tabs
import GeneralTab from './project-settings/GeneralTab';
import TeamAccessTab from './project-settings/TeamAccessTab';
import BillingQuotaTab from './project-settings/BillingQuotaTab';
import AIDiagnosticsTab from './project-settings/AIDiagnosticsTab';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project?: Project; // Optional: If undefined, we are in CREATE mode
    currentUser: User;
    onSave: (e: React.FormEvent, data: Partial<Project>) => void;
    onUserUpdate?: (user: User) => void;
    onNavigate: (page: string) => void;
    fundProject: (params: { amount: number }) => Promise<any>;
    withdrawProjectFunds: (params: { amount: number }) => Promise<any>;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
    isOpen,
    onClose,
    project,
    currentUser,
    onSave,
    onUserUpdate,
    onNavigate,
    fundProject,
    withdrawProjectFunds
}) => {
    const { t } = useTranslation();
    const {
        activeTab,
        setActiveTab,
        formData,
        setFormData,
        isLoading,
        mode,
        fundAmount,
        setFundAmount,
        isProcessingFunds,
        fundMessage,
        isAnalyzing,
        analysisStep,
        analysisResult,
        setAnalysisResult,
        isOwner,
        canChangeStatus,
        userHasPlan,
        canAccessInvestment,
        handleSubmit,
        handleFundAction,
        handleRunDiagnostics,
        applyOptimization,
        applySimulationResult,
        isLight,
        accent,
        error
    } = useEditProjectModal({
        isOpen,
        onClose,
        project,
        currentUser,
        onSave,
        fundProject,
        withdrawProjectFunds
    });

    if (!isOpen) return null;

    // Theme Logic
    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const sidebarBg = isLight ? 'bg-slate-50 border-r border-slate-200' : 'bg-[#18181b] border-r border-white/5';
    const mainBg = isLight ? 'bg-white' : 'bg-[#0e0e10]';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const borderClass = isLight ? 'border-slate-200' : 'border-white/5';
    const sidebarActive = isLight ? `bg-white text-slate-900 shadow-sm border border-slate-200` : 'bg-white/10 text-white shadow-sm border border-white/5';
    const sidebarInactive = isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300';

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row border ${isLight ? 'border-slate-200' : 'border-white/10'}`} onClick={e => e.stopPropagation()}>
                {/* Sidebar */}
                <div className={`w-full md:w-64 flex flex-col shrink-0 ${sidebarBg}`}>
                    <div className={`p-6 border-b ${borderClass}`}>
                        <h3 className={`font-bold text-lg tracking-tight ${textPrimary}`}>{mode === 'CREATE' ? t('modal.newTitle') : t('modal.editTitle')}</h3>
                        <p className={`text-xs mt-1 ${textSecondary}`}>{mode === 'CREATE' ? t('modal.newSubtitle') : t('modal.editSubtitle')}</p>
                    </div>
                    <div className="p-3 space-y-1 overflow-y-auto flex-1">
                        <button onClick={() => setActiveTab('GENERAL')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'GENERAL' ? sidebarActive : sidebarInactive}`}>
                            <Layout size={18} /> {t('modal.tabs.general')}
                        </button>
                        {isOwner && formData.settings && (
                            <>
                                <button onClick={() => setActiveTab('TEAM')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'TEAM' ? sidebarActive : sidebarInactive}`}>
                                    <Users size={18} /> {t('modal.tabs.team')}
                                </button>
                                <button onClick={() => setActiveTab('BILLING')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'BILLING' ? sidebarActive : sidebarInactive}`}>
                                    <Wallet size={18} /> {t('modal.tabs.billing')}
                                </button>

                                <div className={`pt-4 mt-2 border-t ${borderClass}`}>
                                    <button onClick={() => setActiveTab('AI_DIAGNOSTICS')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'AI_DIAGNOSTICS' ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-zinc-500 hover:bg-indigo-500/5 hover:text-indigo-400'}`}>
                                        <BrainCircuit size={18} /> {t('modal.tabs.ai')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className={`p-4 border-t ${borderClass} text-xs ${textSecondary} text-center`}>
                        {mode === 'EDIT' && project ? <span className="font-mono">{project.id}</span> : t('modal.draft')}
                    </div>
                </div>

                {/* Main Content */}
                <div className={`flex-1 flex flex-col min-w-0 ${mainBg}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        <form id="edit-project-form" onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">

                            {activeTab === 'GENERAL' && (
                                <GeneralTab
                                    formData={formData}
                                    setFormData={setFormData}
                                    isOwner={isOwner}
                                    canChangeStatus={canChangeStatus}
                                />
                            )}

                            {activeTab === 'TEAM' && isOwner && formData.settings && (
                                <TeamAccessTab
                                    formData={formData}
                                    setFormData={setFormData}
                                    isOwner={isOwner}
                                    onNavigate={onNavigate}
                                    currentUser={currentUser}
                                />
                            )}

                            {activeTab === 'BILLING' && isOwner && (
                                <BillingQuotaTab
                                    formData={formData}
                                    setFormData={setFormData}
                                    currentUser={currentUser}
                                    onFundAction={handleFundAction}
                                    isProcessingFunds={isProcessingFunds}
                                    fundMessage={fundMessage}
                                    fundAmount={fundAmount}
                                    setFundAmount={setFundAmount}
                                    canAccessInvestment={canAccessInvestment}
                                    userHasPlan={userHasPlan}
                                    mode={mode}
                                />
                            )}

                            {activeTab === 'AI_DIAGNOSTICS' && isOwner && (
                                <AIDiagnosticsTab
                                    mode={mode}
                                    isAnalyzing={isAnalyzing}
                                    analysisStep={analysisStep}
                                    analysisResult={analysisResult}
                                    handleRunDiagnostics={handleRunDiagnostics}
                                    applyOptimization={applyOptimization}
                                    projectConfig={formData}
                                    setAnalysisResult={setAnalysisResult}
                                    onApplySimulation={applySimulationResult}
                                />
                            )}

                        </form>
                    </div>

                    {/* Footer */}
                    <div className={`p-6 border-t flex flex-col gap-4 shrink-0 ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/5'}`}>
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                                <AlertTriangle size={14} />
                                {error}
                            </div>
                        )}
                        <div className="flex justify-between items-center w-full">
                            <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-bold transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>{t('modal.actions.cancel')}</button>
                            <button
                                onClick={() => document.getElementById('edit-project-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                                disabled={isLoading || !formData.title || !formData.description}
                                className={`px-8 py-3 rounded-xl bg-${accent}-600 text-white font-bold hover:bg-${accent}-500 shadow-lg shadow-${accent}-900/20 hover:shadow-${accent}-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait disabled:bg-zinc-600 disabled:shadow-none`}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : mode === 'CREATE' ? <Rocket size={18} /> : <Save size={18} />}
                                {mode === 'CREATE' ? t('modal.actions.create') : t('modal.actions.save')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
