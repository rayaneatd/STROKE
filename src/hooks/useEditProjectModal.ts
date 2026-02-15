import { useState, useEffect } from 'react';
import { Project, User, ProjectRole, SubscriptionPlan, EmployeeAddPermission, OutreachStrategy } from '../types';
import { runProjectDiagnostics, CalibrationResult } from '../services/aiCalibrationEngine';
import { useTheme } from '../context/ThemeContext';

export type TabType = 'GENERAL' | 'TEAM' | 'BILLING' | 'AI_DIAGNOSTICS';

export interface UseEditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project?: Project;
    currentUser: User;
    onSave: (e: React.FormEvent, data: Partial<Project>) => void;
    fundProject: (params: { amount: number }) => void;
    withdrawProjectFunds: (params: { amount: number }) => void;
}

export const useEditProjectModal = ({
    isOpen,
    project,
    currentUser,
    onSave,
    fundProject,
    withdrawProjectFunds
}: UseEditProjectModalProps) => {
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

        setTimeout(onSettled, 600);
    };

    const handleRunDiagnostics = () => {
        const targetProject = (project || formData) as Project;

        if (!targetProject.members) {
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

    return {
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
        accent
    };
};
