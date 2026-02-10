
import React, { useState } from 'react';
import { User, EmployeeAddPermission, UserPreferences, DemoteTarget, AIPreferences, BillingType, SubscriptionPlan, ProjectBillingMode, UIPreferences, OutreachStrategy } from '../types';
import { updateUser as updateUserMock, changePassword, deleteUser } from '../services/mockData';
import { 
    Bell, Shield, Save, Check, Loader2, 
    Layout, AlertCircle, BrainCircuit, Wallet, Palette
} from 'lucide-react';
import DeleteAccountModal from '../components/modals/DeleteAccountModal';
import { useTheme } from '../context/ThemeContext';
import ThemedCard from '../components/ui/ThemedCard';
import ThemedButton from '../components/ui/ThemedButton';

// Sub-Components
import WorkflowSettings from '../components/settings/WorkflowSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AISettings from '../components/settings/AISettings';
import BillingSettings from '../components/settings/BillingSettings';
import SecuritySettings from '../components/settings/SecuritySettings';

interface SettingsProps {
    user: User;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
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

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
    const { updateTheme, styles, accent } = useTheme();
    
    const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'APPEARANCE' | 'NOTIFICATIONS' | 'AI' | 'BILLING' | 'SECURITY'>('WORKFLOW');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
    
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

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-8 pb-12 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${styles.text.primary}`}>Settings</h1>
                    <p className={`mt-1 ${styles.text.secondary}`}>Manage workspace preferences and account security</p>
                </div>
                <ThemedButton onClick={handleSave} isLoading={isLoading} icon={<Save size={18}/>}>
                    Save Changes
                </ThemedButton>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-medium text-sm animate-fade-in ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'success' ? <Check size={18}/> : <AlertCircle size={18}/>}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { id: 'WORKFLOW', label: 'Workflow', icon: <Layout size={18}/> },
                        { id: 'APPEARANCE', label: 'Appearance', icon: <Palette size={18}/> },
                        { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell size={18}/> },
                        { id: 'AI', label: 'AI Configuration', icon: <BrainCircuit size={18}/> },
                        { id: 'BILLING', label: 'Billing Strategy', icon: <Wallet size={18}/> },
                        { id: 'SECURITY', label: 'Security', icon: <Shield size={18}/> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all border border-transparent ${
                                activeTab === tab.id 
                                ? `${styles.bg.accentTransparent} ${styles.text.accent} ${styles.border.accentDim} border shadow-sm` 
                                : `${styles.text.secondary} ${styles.bg.surfaceHover}`
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <ThemedCard className="lg:col-span-3 flex flex-col overflow-hidden min-h-[500px]">
                    <div className="flex-1 p-8">
                        {activeTab === 'WORKFLOW' && (
                            <WorkflowSettings prefs={prefs} onToggle={handleToggle} onSelectChange={handleSelectChange} />
                        )}

                        {activeTab === 'APPEARANCE' && (
                            <AppearanceSettings 
                                prefs={prefs} 
                                onUIConfigChange={handleUIConfigChange} 
                                userSubscription={user.subscriptionPlan}
                            />
                        )}

                        {activeTab === 'NOTIFICATIONS' && (
                            <NotificationSettings 
                                prefs={prefs} 
                                onToggle={handleToggle} 
                                onSelectChange={handleSelectChange}
                            />
                        )}

                        {activeTab === 'AI' && (
                            <AISettings 
                                prefs={prefs} 
                                onAIConfigChange={handleAIConfigChange} 
                            />
                        )}

                        {activeTab === 'BILLING' && (
                            <BillingSettings 
                                billingType={billingType} 
                                overageCap={overageCap} 
                                onBillingTypeChange={setBillingType} 
                                onOverageCapChange={setOverageCap} 
                                isPaidPlan={user.subscriptionPlan !== SubscriptionPlan.FREE}
                            />
                        )}

                        {activeTab === 'SECURITY' && (
                            <SecuritySettings 
                                onChangePassword={handleChangePassword}
                                onDeleteAccount={() => setIsDeleteModalOpen(true)}
                            />
                        )}
                    </div>
                </ThemedCard>
            </div>
            
            <DeleteAccountModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={handleDeleteAccount}
                isDeleting={false} 
            />
        </div>
    );
};

export default Settings;
