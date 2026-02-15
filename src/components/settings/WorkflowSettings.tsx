
import React from 'react';
import { Activity, Ghost, Search, Briefcase, Archive, Mail, Check, AtSign, ChevronDown, ArrowRight, Shield, Users } from 'lucide-react';
import { UserPreferences, OutreachStrategy } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface WorkflowSettingsProps {
    prefs: UserPreferences;
    onToggle: (key: keyof UserPreferences, subKey?: string) => void;
    onSelectChange: (key: keyof UserPreferences, value: any) => void;
}

const Switch = ({ checked, onChange, accentColor }: { checked: boolean; onChange: () => void; accentColor: string }) => (
    <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${checked ? `bg-${accentColor}-600` : 'bg-zinc-600/50'}`}
    >
        <span
            className={`${
                checked ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm`}
        />
    </button>
);

const WorkflowSettings: React.FC<WorkflowSettingsProps> = ({ prefs, onToggle, onSelectChange }) => {
    const { t } = useTranslation();
    const { styles, accent, isLight } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const inputBg = isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/20 border-white/10 text-zinc-200';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const optionClass = isLight ? 'bg-white' : 'bg-[#18181b]';

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Outreach Defaults - Visual Card Selector */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>{t('settings.workflow.outreachDefaults.title')}</h2>
                <p className={`text-sm mb-4 ${styles.text.secondary}`}>{t('settings.workflow.outreachDefaults.description')}</p>
                
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${styles.text.primary}`}>
                        <Mail size={16} /> {t('settings.workflow.outreachDefaults.policyTitle')}
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Option 1: Centralized */}
                            <button
                                onClick={() => onSelectChange('defaultOutreachStrategy', OutreachStrategy.OWNER_IDENTITY)}
                                className={`relative p-5 rounded-xl border-2 text-left transition-all group ${
                                    prefs.defaultOutreachStrategy === OutreachStrategy.OWNER_IDENTITY
                                    ? (isLight ? `bg-${accent}-50 border-${accent}-500 shadow-sm` : `bg-${accent}-500/10 border-${accent}-500 shadow-[0_0_20px_-10px_rgba(var(--color-${accent}-500),0.3)]`)
                                    : `${styles.bg.card} ${styles.border.base} hover:border-opacity-60`
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${prefs.defaultOutreachStrategy === OutreachStrategy.OWNER_IDENTITY ? (isLight ? 'bg-white text-black' : `bg-${accent}-500 text-white`) : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-zinc-400')}`}>
                                        <Shield size={20} />
                                    </div>
                                    {prefs.defaultOutreachStrategy === OutreachStrategy.OWNER_IDENTITY && <div className={`p-1 rounded-full ${isLight ? `bg-${accent}-100 text-${accent}-600` : `bg-${accent}-500 text-white`}`}><Check size={12} strokeWidth={4}/></div>}
                                </div>
                                <div className="font-bold text-sm mb-1">{t('settings.workflow.outreachDefaults.centralized.title')}</div>
                                <p className={`text-xs leading-relaxed ${styles.text.secondary}`}>
                                    {t('settings.workflow.outreachDefaults.centralized.description')}
                                </p>
                            </button>

                            {/* Option 2: Decentralized */}
                            <button
                                onClick={() => onSelectChange('defaultOutreachStrategy', OutreachStrategy.INDIVIDUAL_IDENTITY)}
                                className={`relative p-5 rounded-xl border-2 text-left transition-all group ${
                                    prefs.defaultOutreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY
                                    ? (isLight ? `bg-${accent}-50 border-${accent}-500 shadow-sm` : `bg-${accent}-500/10 border-${accent}-500 shadow-[0_0_20px_-10px_rgba(var(--color-${accent}-500),0.3)]`)
                                    : `${styles.bg.card} ${styles.border.base} hover:border-opacity-60`
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${prefs.defaultOutreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY ? (isLight ? 'bg-white text-black' : `bg-${accent}-500 text-white`) : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-zinc-400')}`}>
                                        <Users size={20} />
                                    </div>
                                    {prefs.defaultOutreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY && <div className={`p-1 rounded-full ${isLight ? `bg-${accent}-100 text-${accent}-600` : `bg-${accent}-500 text-white`}`}><Check size={12} strokeWidth={4}/></div>}
                                </div>
                                <div className="font-bold text-sm mb-1">{t('settings.workflow.outreachDefaults.decentralized.title')}</div>
                                <p className={`text-xs leading-relaxed ${styles.text.secondary}`}>
                                    {t('settings.workflow.outreachDefaults.decentralized.description')}
                                </p>
                            </button>
                        </div>

                        {/* Default Centralized Email Selector */}
                        {prefs.defaultOutreachStrategy === OutreachStrategy.OWNER_IDENTITY && user && (
                            <div className={`animate-fade-in mt-2 p-4 rounded-xl border border-dashed ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/5 border-white/10'}`}>
                                <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.text.secondary}`}>{t('settings.workflow.outreachDefaults.senderAddress')}</label>
                                
                                {(!user.emailIntegrations || user.emailIntegrations.length === 0) ? (
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                        <span className="text-xs font-bold flex items-center gap-2">
                                            <Ghost size={14}/> {t('settings.workflow.outreachDefaults.noEmails')}
                                        </span>
                                        <button 
                                            onClick={() => navigate('/profile')}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${isLight ? 'bg-white border border-red-100 hover:bg-red-50' : 'bg-red-500/20 hover:bg-red-500/30'}`}
                                        >
                                            {t('settings.workflow.outreachDefaults.connect')} <ArrowRight size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <AtSign className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                                        <select
                                            value={prefs.defaultOwnerOutreachEmailId || ''}
                                            onChange={(e) => onSelectChange('defaultOwnerOutreachEmailId', e.target.value)}
                                            className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-${accent}-500 cursor-pointer transition-all ${inputBg}`}
                                        >
                                            <option value="" disabled className={optionClass}>{t('settings.workflow.outreachDefaults.selectPlaceholder')}</option>
                                            {user.emailIntegrations.map(email => (
                                                <option key={email.id} value={email.id} className={optionClass}>
                                                    {email.emailAddress} ({email.provider})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${textSecondary}`} size={16} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`border-t ${styles.border.base}`}></div>

            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>{t('settings.workflow.automation.title')}</h2>
                <p className={`text-sm mb-4 ${styles.text.secondary}`}>{t('settings.workflow.automation.description')}</p>
                <div className="space-y-6">
                    {/* Auto Archive */}
                    <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${styles.bg.card} ${styles.text.secondary}`}>
                                <Archive size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${styles.text.primary}`}>{t('settings.workflow.automation.autoArchive.title')}</h3>
                                <p className={`text-xs mt-1 ${styles.text.secondary}`}>{t('settings.workflow.automation.autoArchive.description')}</p>
                            </div>
                        </div>
                        <Switch checked={prefs.autoArchiveProjects} onChange={() => onToggle('autoArchiveProjects')} accentColor={accent} />
                    </div>

                    {/* Compact Mode */}
                    <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${styles.bg.card} ${styles.text.secondary}`}>
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${styles.text.primary}`}>{t('settings.workflow.automation.compactMode.title')}</h3>
                                <p className={`text-xs mt-1 ${styles.text.secondary}`}>{t('settings.workflow.automation.compactMode.description')}</p>
                            </div>
                        </div>
                        <Switch checked={prefs.compactMode} onChange={() => onToggle('compactMode')} accentColor={accent} />
                    </div>
                </div>
            </div>

            {/* Role Permissions */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>{t('settings.workflow.roles.title')}</h2>
                <p className={`text-sm mb-4 ${styles.text.secondary}`}>{t('settings.workflow.roles.description')}</p>
                
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <h3 className={`font-bold text-sm mb-6 flex items-center gap-2 ${styles.text.primary}`}>
                        <Activity size={16} /> {t('settings.workflow.roles.analystPermissions')}
                    </h3>
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className={`font-bold text-xs ${styles.text.secondary}`}>{t('settings.workflow.roles.activityView.title')}</h4>
                                <p className={`text-[10px] mt-0.5 ${styles.text.tertiary}`}>{t('settings.workflow.roles.activityView.description')}</p>
                            </div>
                            <Switch checked={prefs.defaultAnalystCanViewActivity} onChange={() => onToggle('defaultAnalystCanViewActivity')} accentColor={accent} />
                        </div>
                        <div className={`border-t ${styles.border.base}`}></div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className={`font-bold text-xs ${styles.text.secondary}`}>{t('settings.workflow.roles.ghostingTool.title')}</h4>
                                <p className={`text-[10px] mt-0.5 ${styles.text.tertiary}`}>{t('settings.workflow.roles.ghostingTool.description')}</p>
                            </div>
                            <Switch checked={prefs.defaultAnalystCanUseGhosting} onChange={() => onToggle('defaultAnalystCanUseGhosting')} accentColor={accent} />
                        </div>
                    </div>
                </div>

                <div className={`mt-4 p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <h3 className={`font-bold text-sm mb-6 flex items-center gap-2 ${styles.text.primary}`}>
                        <Search size={16} /> Scout Permissions
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className={`font-bold text-xs ${styles.text.secondary}`}>Scout Ghosting Tool</h4>
                            <p className={`text-[10px] mt-0.5 ${styles.text.tertiary}`}>Can scouts send mass rejection emails?</p>
                        </div>
                        <Switch checked={prefs.defaultScoutCanUseGhosting} onChange={() => onToggle('defaultScoutCanUseGhosting')} accentColor={accent} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowSettings;
