
import React from 'react';
import { User, SubscriptionPlan } from '../../types';
import {
    Bell, Shield, Save, Check, Loader2,
    Layout, AlertCircle, BrainCircuit, Wallet, Palette, Globe
} from 'lucide-react';
import DeleteAccountModal from '../../components/modals/DeleteAccountModal';
import ThemedCard from '../../components/ui/ThemedCard';
import ThemedButton from '../../components/ui/ThemedButton';
import { useSettings } from '../../hooks/useSettings';
import LanguageSwitcher from '../../components/LanguageSwitcher'; // Import LanguageSwitcher
import { useTranslation } from 'react-i18next';

// Sub-Components
import WorkflowSettings from '../../components/settings/WorkflowSettings';
import AppearanceSettings from '../../components/settings/AppearanceSettings';
import NotificationSettings from '../../components/settings/NotificationSettings';
import AISettings from '../../components/settings/AISettings';
import BillingSettings from '../../components/settings/BillingSettings';
import SecuritySettings from '../../components/settings/SecuritySettings';

interface SettingsProps {
    user: User;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
    const { t } = useTranslation();
    const {
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
        handleDeleteAccount,
        styles
    } = useSettings({ user, onUpdateUser, onLogout });

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-8 pb-12 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${styles.text.primary}`}>{t('settings.title')}</h1>
                    <p className={`mt-1 ${styles.text.secondary}`}>{t('settings.subtitle')}</p>
                </div>
                <ThemedButton onClick={handleSave} isLoading={isLoading} icon={<Save size={18} />}>
                    {t('settings.save')}
                </ThemedButton>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-medium text-sm animate-fade-in ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { id: 'WORKFLOW', label: t('settings.tabs.workflow'), icon: <Layout size={18} /> },
                        { id: 'APPEARANCE', label: t('settings.tabs.appearance'), icon: <Palette size={18} /> },
                        { id: 'LANGUAGE', label: t('settings.tabs.language'), icon: <Globe size={18} /> }, // Added Language Tab
                        { id: 'NOTIFICATIONS', label: t('settings.tabs.notifications'), icon: <Bell size={18} /> },
                        { id: 'AI', label: t('settings.tabs.ai'), icon: <BrainCircuit size={18} /> },
                        { id: 'BILLING', label: t('settings.tabs.billing'), icon: <Wallet size={18} /> },
                        { id: 'SECURITY', label: t('settings.tabs.security'), icon: <Shield size={18} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all border border-transparent ${activeTab === tab.id
                                    ? `${styles.bg.accentTransparent} ${styles.text.accent} ${styles.border.accentDim} border shadow-sm`
                                    : `${styles.text.secondary} ${styles.bg.surfaceHover}`
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-[500px]">
                    <div className="flex-1 p-8 bg-transparent">
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

                        {activeTab === 'LANGUAGE' && (
                            <LanguageSwitcher />
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
                                onDeleteAccount={() => setIsDeleteModalOpen(true)}
                            />
                        )}
                    </div>
                </div>
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
