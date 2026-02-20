import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    fundProject: (params: { amount: number }) => Promise<any>;
    withdrawProjectFunds: (params: { amount: number }) => Promise<any>;
}

export const useEditProjectModal = ({
    isOpen,
    project,
    currentUser,
    onSave,
    fundProject,
    withdrawProjectFunds
}: UseEditProjectModalProps) => {
    const { t } = useTranslation();
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

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
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
                        adminScanQuota: 'UNLIMITED',
                        scoutScanQuota: 'UNLIMITED',
                        partnerScanQuota: 'UNLIMITED',
                        analystScanQuota: 'UNLIMITED',
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
        setError(null);

        // Validation: Insufficient Funds (Create Mode)
        if (mode === 'CREATE' && formData.settings?.billingMode === 'PROJECT_INVESTMENT') {
            const budget = formData.investmentBalance || 0;
            if (budget > currentUser.scansBalance) {
                setError(t('project.errors.insufficientFunds', 'Insufficient funds in your wallet'));
                return;
            }
        }

        setIsLoading(true);
        setTimeout(() => {
            onSave(e, formData);
            setIsLoading(false);
        }, 600);
    };

    const handleFundAction = async (action: 'DEPOSIT' | 'WITHDRAW') => {
        if (mode === 'CREATE' || !project) return;
        const amount = Number(fundAmount);
        if (amount <= 0) return;

        setIsProcessingFunds(true);
        setFundMessage(null);

        try {
            if (action === 'DEPOSIT') {
                await fundProject({ amount });
                setFundMessage({ type: 'success', text: t('modal.billing.depositSuccess') });
            } else {
                await withdrawProjectFunds({ amount });
                setFundMessage({ type: 'success', text: t('modal.billing.withdrawSuccess') });
            }
            
            setFundAmount('');
            // Refresh data in parent component will happen automatically via query invalidation
            // But we need to update local form data if we are showing it
            setFormData(prev => ({
                ...prev,
                investmentBalance: action === 'DEPOSIT' 
                    ? (prev.investmentBalance || 0) + amount 
                    : (prev.investmentBalance || 0) - amount
            }));

        } catch (error: any) {
            console.error('Fund action error:', error);
            setFundMessage({ type: 'error', text: error.message || t('modal.billing.error') });
        } finally {
            setIsProcessingFunds(false);
        }
    };

    const handleRunDiagnostics = () => {
        const targetProject = (project || formData) as Project;

        if (!targetProject.members) {
            targetProject.members = [];
        }

        setIsAnalyzing(true);
        setAnalysisStep(t('modal.ai.step1'));

        setTimeout(() => setAnalysisStep(t('modal.ai.step2')), 600);
        setTimeout(() => setAnalysisStep(t('modal.ai.step3')), 1200);
        setTimeout(() => setAnalysisStep(t('modal.ai.step4')), 1800);

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
        accent,
        error
    };
};
