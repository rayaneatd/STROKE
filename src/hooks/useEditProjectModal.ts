import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, User, ProjectRole, SubscriptionPlan, EmployeeAddPermission, OutreachStrategy } from '../types';
import { useTheme } from '../context/ThemeContext';

export type TabType = 'GENERAL' | 'TEAM' | 'BILLING' | 'CALIBRATION';

export interface UseEditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project?: Project;
    currentUser: User;
    onSave: (e: React.FormEvent, data: Partial<Project>) => void;
    fundProject: (params: { amount: number }) => Promise<any>;
    withdrawProjectFunds: (params: { amount: number }) => Promise<any>;
}

import { supabase } from '../lib/supabase';

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

    // AI Diagnostics State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const [error, setError] = useState<string | null>(null);

    // 1. Reset Tab ONLY when the modal first opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab('GENERAL');
            setError(null);
            setFundAmount('');
            setFundMessage(null);
        }
    }, [isOpen]);

    // 2. Sync Form Data when project/user changes, but don't reset the tab
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
                    ownerId: currentUser.id,
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
                        defaultScanQuota: (currentUser.preferences?.defaultScanQuota === -1 || String(currentUser.preferences?.defaultScanQuota) === '-1' ? 'UNLIMITED' : currentUser.preferences?.defaultScanQuota) || 'UNLIMITED',
                        adminScanQuota: 'UNLIMITED',
                        scoutScanQuota: 'UNLIMITED',
                        partnerScanQuota: 'UNLIMITED',
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

    const handleSubmit = async (e: React.FormEvent) => {
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

        try {
            if (mode === 'EDIT' && project && project.id) {
                // Use new RPC for updating settings and syncing quotas
                const { error: rpcError } = await supabase.rpc('update_project_settings_and_sync_quotas', {
                    p_project_id: project.id,
                    p_settings: formData.settings
                });

                if (rpcError) throw rpcError;

                // Also call onSave for other fields (title, description, etc.) which might use standard update
                // But since onSave likely does a full update, we might be double updating.
                // However, onSave in parent (useProjects) typically calls updateProject.
                // To be safe and ensure UI updates, we proceed with onSave.
                // The RPC only updates settings and quotas.
                // We should ensure onSave doesn't overwrite the work done by RPC if it's concurrent, 
                // but since we await RPC first, onSave (which uses supabase update) will just overwrite settings with same values.
                // Ideally, onSave should be refactored to use this RPC or we just use this RPC for settings.

                // For now, to meet the requirement "make sure changes reflect on existing members", the RPC is critical.
                // We will call onSave as normal to handle the rest of the flow (UI update, toast, etc.)
                onSave(e, formData);
            } else {
                // CREATE Mode - standard flow
                onSave(e, formData);
            }
        } catch (err: any) {
            console.error('Error updating project settings:', err);
            setError(err.message || 'Failed to update settings');
        } finally {
            setIsLoading(false);
        }
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
        isLight,
        accent,
        error
    };
};
