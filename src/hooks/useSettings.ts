import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, UserPreferences, EmployeeAddPermission, AIPreferences, UIPreferences, BillingType, SubscriptionPlan, OutreachStrategy } from '../types';
import { supabase } from '../lib/supabase';
import { Json } from '../lib/database.types';
import { useTheme } from '../context/ThemeContext';

export const DEFAULT_PREFERENCES: UserPreferences = {
    defaultInvitationPermission: EmployeeAddPermission.ALL,
    defaultQuickDemoteTarget: 'VISITOR',
    defaultAnalystAccessOnlyForCompleted: false,
    defaultAdminCanChangeStatus: false,
    defaultAdminCanManageQuotas: false,
    defaultAnalystCanViewActivity: true,
    defaultAnalystCanUseGhosting: false,
    defaultScoutCanUseGhosting: false,
    defaultScanQuota: 'UNLIMITED',
    defaultBillingMode: 'OWNER_WALLET',
    defaultInvestmentBudget: 100,
    defaultOutreachStrategy: OutreachStrategy.INDIVIDUAL_IDENTITY,
    autoArchiveProjects: false,
    compactMode: false,
    notifications: {
        email: true,
        push: true,
        digestFrequency: 'WEEKLY'
    },
    aiConfig: {
        strictness: 'MEDIUM',
        tone: 'PROFESSIONAL',
        emailPersona: 'EMPATHETIC',
        antiGhosting: false,
        rejectionContext: false
    },
    uiConfig: {
        theme: 'DARK',
        ambientGlow: 'slate',
        accentColor: 'slate',
        reducedMotion: false,
        glassIntensity: 'MEDIUM',
        density: 'COMFORTABLE'
    }
};

interface UseSettingsProps {
    user: User;
    onUpdateUser: (data: Partial<User>, sync?: boolean) => void;
    onLogout: () => void;
}

export const useSettings = ({ user, onUpdateUser, onLogout }: UseSettingsProps) => {
    const queryClient = useQueryClient();
    const { updateTheme, styles } = useTheme();

    const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'APPEARANCE' | 'NOTIFICATIONS' | 'AI' | 'BILLING' | 'SECURITY'>('WORKFLOW');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initialize state with user preferences or defaults (Deep Merge)
    const [prefs, setPrefs] = useState<UserPreferences>(() => {
        return {
            ...DEFAULT_PREFERENCES,
            ...(user.preferences || {}),
            notifications: {
                ...DEFAULT_PREFERENCES.notifications,
                ...(user.preferences?.notifications || {})
            },
            aiConfig: {
                ...DEFAULT_PREFERENCES.aiConfig,
                ...(user.preferences?.aiConfig || {})
            },
            uiConfig: {
                ...DEFAULT_PREFERENCES.uiConfig,
                ...(user.preferences?.uiConfig || {})
            }
        };
    });

    const [billingType, setBillingType] = useState<BillingType>(user.billingType || BillingType.PREPAID);
    const [overageCap, setOverageCap] = useState<number | 'UNLIMITED'>(user.overageCap || 500);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Sync internal state with external user changes (Real-time)
    useEffect(() => {
        if (user.preferences) {
            setPrefs(prev => ({
                ...prev,
                ...user.preferences,
                notifications: { ...prev.notifications, ...user.preferences?.notifications },
                aiConfig: { ...prev.aiConfig, ...user.preferences?.aiConfig },
                uiConfig: { ...prev.uiConfig, ...user.preferences?.uiConfig }
            }));
        }
        if (user.billingType) setBillingType(user.billingType);
        if (user.overageCap) setOverageCap(user.overageCap);
    }, [user.preferences, user.billingType, user.overageCap]);

    // Mutation for saving settings
    const saveMutation = useMutation({
        mutationFn: async (data: { preferences: UserPreferences, billingType: BillingType, overageCap: number | 'UNLIMITED' }) => {
            const { error } = await supabase.rpc('update_user_profile', {
                p_preferences: data.preferences as unknown as Json,
                p_billing_type: data.billingType,
                p_overage_cap: data.overageCap === 'UNLIMITED' ? -1 : data.overageCap,
                p_company: (data.preferences as any).company,
                p_industry: (data.preferences as any).industry
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            onUpdateUser({ preferences: prefs, billingType, overageCap });
            setMessage({ type: 'success', text: 'Preferences saved successfully.' });
        },
        onError: (err: any) => {
            console.error('Save settings error:', err);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        }
    });

    const handleToggle = (key: keyof UserPreferences, subKey?: string) => {
        if (subKey && typeof prefs[key] === 'object') {
            setPrefs(prev => ({
                ...prev,
                [key]: {
                    ...(prev[key] as any),
                    [subKey]: !(prev[key] as any)[subKey]
                }
            }));
        } else {
            setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const handleSelectChange = (key: keyof UserPreferences, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    const handleAIConfigChange = (key: keyof AIPreferences, value: any) => {
        setPrefs(prev => ({
            ...prev,
            aiConfig: {
                ...(prev.aiConfig || DEFAULT_PREFERENCES.aiConfig!),
                [key]: value
            }
        }));
    };

    const handleUIConfigChange = (key: keyof UIPreferences, value: any) => {
        const newUiConfig = {
            ...(prefs.uiConfig || DEFAULT_PREFERENCES.uiConfig!),
            [key]: value
        };
        const newPrefs = { ...prefs, uiConfig: newUiConfig };
        setPrefs(newPrefs);

        // Immediate Update via Context
        updateTheme({ [key]: value });

        // Update local and backend user state immediately for UI consistency
        onUpdateUser({ preferences: newPrefs }, true);
    };

    const handleSave = () => {
        setMessage(null);
        saveMutation.mutate({ preferences: prefs, billingType, overageCap });
    };

    const handleChangePassword = async (old: string, newP: string, confirmP: string) => {
        if (newP !== confirmP) {
            setMessage({ type: 'error', text: "Passwords don't match" });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newP });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password changed successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to change password' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        try {
            // Note: In Supabase, deleting from public.profiles might be enough if you have triggers
            // or you might want to call a dedicated edge function because users cannot delete themselves from auth.users via client side easily.
            // For now, let's just sign out or try to delete the profile if RLS allows.
            const { error } = await supabase.from('profiles').delete().eq('id', user.id);
            if (error) throw error;

            await supabase.auth.signOut();
            onLogout();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete account' });
            setIsLoading(false);
        }
    };

    return {
        activeTab,
        setActiveTab,
        isLoading: isLoading || saveMutation.isPending,
        message,
        prefs,
        billingType,
        setBillingType,
        overageCap,
        setOverageCap,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        handleToggle,
        handleSelectChange,
        handleAIConfigChange,
        handleUIConfigChange,
        handleSave,
        handleDeleteAccount,
        styles // Exposed from useTheme
    };
};
