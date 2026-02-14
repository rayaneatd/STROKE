
import React, { useState, useEffect } from 'react';
import {
    X, Edit2, Layout, Users, Save, Loader2, Wallet, BrainCircuit, Rocket
} from 'lucide-react';
import { Project, User, ProjectRole, SubscriptionPlan, EmployeeAddPermission, OutreachStrategy } from '../../types';
import { runProjectDiagnostics, CalibrationResult } from '../../services/aiCalibrationEngine';
import { useTheme } from '../../context/ThemeContext';

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
    fundProject: (params: { amount: number }) => void;
    withdrawProjectFunds: (params: { amount: number }) => void;
}

type TabType = 'GENERAL' | 'TEAM' | 'BILLING' | 'AI_DIAGNOSTICS';

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
    const { isLight, accent } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('GENERAL');
    const [formData, setFormData] = useState<Partial<Project>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Determine Mode
    const mode = project ? 'EDIT' : 'CREATE';

    // Billing States
    const [fundAmount, setFundAmount] = useState<number | ''>('');
    const [isProcessingFunds, setIsProcessingFunds] = useState(false);
    const [fundMessage, setFundMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // AI Diagnostics States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<CalibrationResult | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (project) {
                // EDIT MODE: Load existing data
                setFormData({
                    id: project.id,
                    ownerId: project.ownerId,
                    title: project.title,
                    description: project.description,
                    status: project.status,
                    investmentBalance: project.investmentBalance || 0,
                    settings: { ...project.settings },
                    members: [...project.members]
                });
            } else {
                // CREATE MODE: Load defaults
                setFormData({
                    title: '',
                    description: '',
                    ownerId: currentUser.id, // Explicitly set owner for new project
                    status: 'ACTIVE',
                    investmentBalance: currentUser.preferences?.defaultInvestmentBudget || 0,
                    settings: {
                        employeeAddPermission: currentUser.preferences?.defaultInvitationPermission || EmployeeAddPermission.ALL,
                        quickDemoteTarget: currentUser.preferences?.defaultQuickDemoteTarget || 'VISITOR',
                        analystAccessOnlyForCompleted: currentUser.preferences?.defaultAnalystAccessOnlyForCompleted || false,
                        adminCanChangeStatus: currentUser.preferences?.defaultAdminCanChangeStatus || false,
                        adminCanManageQuotas: currentUser.preferences?.defaultAdminCanManageQuotas || false,
                        analystCanViewActivity: currentUser.preferences?.defaultAnalystCanViewActivity !== undefined ? currentUser.preferences?.defaultAnalystCanViewActivity : true,
                        analystCanUseGhosting: currentUser.preferences?.defaultAnalystCanUseGhosting || false,
                        scoutCanUseGhosting: currentUser.preferences?.defaultScoutCanUseGhosting || false,
                        defaultScanQuota: currentUser.preferences?.defaultScanQuota || 'UNLIMITED',
                        billingMode: currentUser.preferences?.defaultBillingMode || 'OWNER_WALLET',
                        outreachStrategy: currentUser.preferences?.defaultOutreachStrategy || OutreachStrategy.INDIVIDUAL_IDENTITY,
                        ownerOutreachEmailId: currentUser.preferences?.defaultOwnerOutreachEmailId
                    },
                    members: [{
                        userId: currentUser.id,
                        role: ProjectRole.OWNER,
                        permissions: ['SCAN', 'ANALYZE'],
                        scansUsed: 0,
                        scanQuota: 'UNLIMITED',
                        joinedAt: new Date().toISOString()
                    }]
                });
            }

            // Reset temporary states
            setFundAmount('');
            setFundMessage(null);
            setAnalysisResult(null);
            setActiveTab('GENERAL');
        }
    }, [isOpen, project, currentUser.preferences, currentUser.id]);

    if (!isOpen) return null;

    // Permissions Logic
    let isOwner = true;
    let canChangeStatus = true;

    if (mode === 'EDIT' && project) {
        const memberRecord = project.members.find(m => m.userId === currentUser.id);
        const userRole = memberRecord?.role || ProjectRole.EMPLOYEE;
        const isAdmin = userRole === ProjectRole.ADMIN;
        isOwner = userRole === ProjectRole.OWNER;
        canChangeStatus = isOwner || (isAdmin && project.settings.adminCanChangeStatus);
    }

    const userHasPlan = currentUser.subscriptionPlan === SubscriptionPlan.TEAM || currentUser.subscriptionPlan === SubscriptionPlan.ELITE;
    const canAccessInvestment = currentUser.subscriptionPlan !== SubscriptionPlan.ESSENTIAL;

    // Theme Logic
    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const sidebarBg = isLight ? 'bg-slate-50 border-r border-slate-200' : 'bg-[#18181b] border-r border-white/5';
    const mainBg = isLight ? 'bg-white' : 'bg-[#0e0e10]';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const borderClass = isLight ? 'border-slate-200' : 'border-white/5';
    const sidebarActive = isLight ? `bg-white text-slate-900 shadow-sm border border-slate-200` : 'bg-white/10 text-white shadow-sm border border-white/5';
    const sidebarInactive = isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            onSave(e, formData);
            setIsLoading(false);
        }, 600);
    };

    const handleFundAction = (action: 'DEPOSIT' | 'WITHDRAW') => {
        if (mode === 'CREATE' || !project) return;
        const amount = Number(fundAmount);
        if (amount <= 0) return;

        setIsProcessingFunds(true);
        setFundMessage(null);

        const onSettled = () => {
            setIsProcessingFunds(false);
            setFundAmount('');
        };

        if (action === 'DEPOSIT') {
            fundProject({ amount });
        } else {
            withdrawProjectFunds({ amount });
        }

        // Since mutations are async via react-query, we'll clear local loading for now
        // Real-time updates or onSettled callbacks in useProjectDetail will handle the rest
        setTimeout(onSettled, 600);
    };

    const handleRunDiagnostics = () => {
        // In create mode, we pass the temporary formData as the project
        // Ensure members is present to avoid undefined error in forEach
        const targetProject = (project || formData) as Project;

        if (!targetProject.members) {
            // Fallback if members is somehow missing
            targetProject.members = [];
        }

        setIsAnalyzing(true);
        setAnalysisStep('Analyzing upload velocity...');

        setTimeout(() => setAnalysisStep('Calculating member burn rates...'), 600);
        setTimeout(() => setAnalysisStep('Forecasting monthly budget...'), 1200);
        setTimeout(() => setAnalysisStep('Generating optimization plan...'), 1800);

        setTimeout(() => {
            const result = runProjectDiagnostics(targetProject, currentUser);
            setAnalysisResult(result);
            setIsAnalyzing(false);
        }, 2400);
    };

    const applyOptimization = () => {
        if (!analysisResult) return;
        const recs = analysisResult.recommendations;
        setFormData(prev => ({
            ...prev,
            investmentBalance: recs.billingMode === 'PROJECT_INVESTMENT'
                ? Math.max(prev.investmentBalance || 0, recs.budget)
                : prev.investmentBalance,
            settings: {
                ...prev.settings!,
                billingMode: recs.billingMode,
                defaultScanQuota: recs.quota
            }
        }));
        setAnalysisResult(null);
        setActiveTab('BILLING');
    };

    const applySimulationResult = (budget: number, quota: number | 'UNLIMITED', billingMode: any) => {
        setFormData(prev => ({
            ...prev,
            investmentBalance: budget,
            settings: {
                ...prev.settings!,
                billingMode: billingMode,
                defaultScanQuota: quota
            }
        }));
        setActiveTab('BILLING');
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row border ${isLight ? 'border-slate-200' : 'border-white/10'}`} onClick={e => e.stopPropagation()}>
                {/* Sidebar */}
                <div className={`w-full md:w-64 flex flex-col shrink-0 ${sidebarBg}`}>
                    <div className={`p-6 border-b ${borderClass}`}>
                        <h3 className={`font-bold text-lg tracking-tight ${textPrimary}`}>{mode === 'CREATE' ? 'New Project' : 'Project Settings'}</h3>
                        <p className={`text-xs mt-1 ${textSecondary}`}>{mode === 'CREATE' ? 'Setup configuration' : 'Manage configuration'}</p>
                    </div>
                    <div className="p-3 space-y-1 overflow-y-auto flex-1">
                        <button onClick={() => setActiveTab('GENERAL')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'GENERAL' ? sidebarActive : sidebarInactive}`}>
                            <Layout size={18} /> General
                        </button>
                        {isOwner && formData.settings && (
                            <>
                                <button onClick={() => setActiveTab('TEAM')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'TEAM' ? sidebarActive : sidebarInactive}`}>
                                    <Users size={18} /> Team & Permissions
                                </button>
                                <button onClick={() => setActiveTab('BILLING')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'BILLING' ? sidebarActive : sidebarInactive}`}>
                                    <Wallet size={18} /> Billing & Quotas
                                </button>

                                <div className={`pt-4 mt-2 border-t ${borderClass}`}>
                                    <button onClick={() => setActiveTab('AI_DIAGNOSTICS')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'AI_DIAGNOSTICS' ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-zinc-500 hover:bg-indigo-500/5 hover:text-indigo-400'}`}>
                                        <BrainCircuit size={18} /> AI Diagnostics
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className={`p-4 border-t ${borderClass} text-xs ${textSecondary} text-center`}>
                        {mode === 'EDIT' && project ? <span className="font-mono">{project.id}</span> : 'Draft Mode'}
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
                    <div className={`p-6 border-t flex justify-between items-center shrink-0 ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/5'}`}>
                        <button type="button" onClick={onClose} className={`px-6 py-3 rounded-xl font-bold transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>Cancel</button>
                        <button
                            onClick={() => document.getElementById('edit-project-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                            disabled={isLoading || !formData.title || !formData.description}
                            className={`px-8 py-3 rounded-xl bg-${accent}-600 text-white font-bold hover:bg-${accent}-500 shadow-lg shadow-${accent}-900/20 hover:shadow-${accent}-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait disabled:bg-zinc-600 disabled:shadow-none`}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : mode === 'CREATE' ? <Rocket size={18} /> : <Save size={18} />}
                            {mode === 'CREATE' ? 'Create Project' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
