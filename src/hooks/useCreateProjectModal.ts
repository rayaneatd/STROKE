import { useState, useEffect } from 'react';
import { User, EmployeeAddPermission, DemoteTarget, Project, SubscriptionPlan, ProjectBillingMode, OutreachStrategy } from '../types';
import { useTheme } from '../context/ThemeContext';

export interface CreateProjectState {
    title: string;
    description: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
    employeeAddPermission: EmployeeAddPermission;
    quickDemoteTarget: DemoteTarget;
    analystAccessOnlyForCompleted: boolean;
    adminCanChangeStatus: boolean;
    adminCanManageQuotas: boolean;
    analystCanViewActivity: boolean;
    analystCanUseGhosting: boolean;
    scoutCanUseGhosting: boolean;
    defaultScanQuota: number | 'UNLIMITED';
    billingMode: ProjectBillingMode;
    investmentBudget: number;
    outreachStrategy: OutreachStrategy;
    ownerOutreachEmailId: string;
}

interface UseCreateProjectModalProps {
    currentUser: User;
    onCreate: (project: Partial<Project>) => void;
    onClose: () => void;
}

export const useCreateProjectModal = ({ currentUser, onCreate, onClose }: UseCreateProjectModalProps) => {
    const { isLight, accent } = useTheme();

    // Initialize state with User Preferences defaults
    const [newProjectData, setNewProjectData] = useState<CreateProjectState>({
        title: '',
        description: '',
        status: 'ACTIVE',

        // Default Permissions
        employeeAddPermission: currentUser.preferences?.defaultInvitationPermission || EmployeeAddPermission.ALL,
        quickDemoteTarget: currentUser.preferences?.defaultQuickDemoteTarget || 'VISITOR',
        analystAccessOnlyForCompleted: currentUser.preferences?.defaultAnalystAccessOnlyForCompleted || false,
        adminCanChangeStatus: currentUser.preferences?.defaultAdminCanChangeStatus || false,
        adminCanManageQuotas: currentUser.preferences?.defaultAdminCanManageQuotas || false,
        analystCanViewActivity: currentUser.preferences?.defaultAnalystCanViewActivity ?? true,
        analystCanUseGhosting: currentUser.preferences?.defaultAnalystCanUseGhosting || false,
        scoutCanUseGhosting: currentUser.preferences?.defaultScoutCanUseGhosting || false,

        // Default Quotas & Billing
        defaultScanQuota: currentUser.preferences?.defaultScanQuota ?? 'UNLIMITED',
        billingMode: currentUser.preferences?.defaultBillingMode || 'OWNER_WALLET',
        investmentBudget: currentUser.preferences?.defaultInvestmentBudget || 0,

        // Default Outreach
        outreachStrategy: currentUser.preferences?.defaultOutreachStrategy || OutreachStrategy.INDIVIDUAL_IDENTITY,
        ownerOutreachEmailId: currentUser.preferences?.defaultOwnerOutreachEmailId || ''
    });

    const hasQuotaFeature = currentUser.subscriptionPlan === SubscriptionPlan.TEAM || currentUser.subscriptionPlan === SubscriptionPlan.ELITE;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectData.title || !newProjectData.description) return;

        // Auto-select first email if centralized is chosen but no email selected
        let finalOwnerEmailId = newProjectData.ownerOutreachEmailId;
        if (newProjectData.outreachStrategy === OutreachStrategy.OWNER_IDENTITY && !finalOwnerEmailId && currentUser.emailIntegrations.length > 0) {
            finalOwnerEmailId = currentUser.emailIntegrations[0].id;
        }

        // Construct settings object properly
        const projectPayload = {
            ...newProjectData,
            investmentBalance: newProjectData.billingMode === 'PROJECT_INVESTMENT' ? newProjectData.investmentBudget : 0,
            settings: {
                employeeAddPermission: newProjectData.employeeAddPermission,
                quickDemoteTarget: newProjectData.quickDemoteTarget,
                analystAccessOnlyForCompleted: newProjectData.analystAccessOnlyForCompleted,
                adminCanChangeStatus: newProjectData.adminCanChangeStatus,
                adminCanManageQuotas: newProjectData.adminCanManageQuotas,
                analystCanViewActivity: newProjectData.analystCanViewActivity,
                analystCanUseGhosting: newProjectData.analystCanUseGhosting,
                scoutCanUseGhosting: newProjectData.scoutCanUseGhosting,
                defaultScanQuota: newProjectData.defaultScanQuota,
                billingMode: newProjectData.billingMode,
                outreachStrategy: newProjectData.outreachStrategy,
                ownerOutreachEmailId: finalOwnerEmailId
            }
        };

        // Remove flat properties to clean up payload
        const sanitizedPayload = { ...projectPayload };
        delete (sanitizedPayload as any).employeeAddPermission;
        delete (sanitizedPayload as any).quickDemoteTarget;
        delete (sanitizedPayload as any).analystAccessOnlyForCompleted;
        delete (sanitizedPayload as any).adminCanChangeStatus;
        delete (sanitizedPayload as any).adminCanManageQuotas;
        delete (sanitizedPayload as any).analystCanViewActivity;
        delete (sanitizedPayload as any).analystCanUseGhosting;
        delete (sanitizedPayload as any).scoutCanUseGhosting;
        delete (sanitizedPayload as any).defaultScanQuota;
        delete (sanitizedPayload as any).billingMode;
        delete (sanitizedPayload as any).investmentBudget;
        delete (sanitizedPayload as any).outreachStrategy;
        delete (sanitizedPayload as any).ownerOutreachEmailId;

        onCreate(sanitizedPayload);
        onClose(); // Ideally, the parent handles closing, but we trigger it here if successful
    };

    return {
        newProjectData,
        setNewProjectData,
        handleSubmit,
        hasQuotaFeature,
        isLight,
        accent
    };
};
