import { useState } from 'react';
import { User, UserPreferences, EmployeeAddPermission, AIPreferences, UIPreferences, BillingType, SubscriptionPlan, OutreachStrategy } from '../types';
import { updateUser as updateUserMock, changePassword, deleteUser } from '../services/mockData';
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
        accentColor: 'blue',
        reducedMotion: false,
        glassIntensity: 'MEDIUM',
        density: 'COMFORTABLE'
    }
};

interface UseSettingsProps {
    user: User;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
}

export const useSettings = ({ user, onUpdateUser, onLogout }: UseSettingsProps) => {
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

        // Update user state
        const updatedUser = { ...user, preferences: newPrefs };
        onUpdateUser(updatedUser);

        updateUserMock(user.id, { preferences: newPrefs });
    };

    const handleSave = () => {
        setIsLoading(true);
        setMessage(null);
        setTimeout(() => {
            try {
                const updatedUser = updateUserMock(user.id, {
                    preferences: prefs,
                    billingType: billingType,
                    overageCap: overageCap
                });
                onUpdateUser(updatedUser);
                setMessage({ type: 'success', text: 'Preferences saved successfully.' });
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to save settings.' });
            } finally {
                setIsLoading(false);
            }
        }, 800);
    };

    const handleChangePassword = (old: string, newP: string, confirmP: string) => {
        if (newP !== confirmP) {
            setMessage({ type: 'error', text: "Passwords don't match" });
            return;
        }
        if (changePassword(user.id, old, newP)) {
            setMessage({ type: 'success', text: 'Password changed successfully' });
        } else {
            setMessage({ type: 'error', text: 'Incorrect current password' });
        }
    };

    const handleDeleteAccount = () => {
        deleteUser(user.id);
        onLogout();
    };

    return {
        activeTab,
        setActiveTab,
        isLoading,
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
        handleChangePassword,
        handleDeleteAccount,
        styles // Exposed from useTheme
    };
};
