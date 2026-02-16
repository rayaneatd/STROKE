
import React from 'react';
import {
    X, Rocket, Type, Sparkles, CheckCircle, ChevronDown, Shield, Users, Calculator, Infinity, Mail, AtSign, ArrowRight, Check, Ghost, AlertTriangle
} from 'lucide-react';
import { User, Project, SubscriptionPlan, ProjectBillingMode, OutreachStrategy } from '../../types';
import { useCreateProjectModal, CreateProjectState } from '../../hooks/useCreateProjectModal';
import { useTranslation } from 'react-i18next';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    onCreate: (project: Partial<Project>) => void;
    onNavigate: (page: string) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    onCreate,
    onNavigate
}) => {
    const { t } = useTranslation();
    const {
        newProjectData,
        setNewProjectData,
        handleSubmit,
        error,
        hasQuotaFeature,
        isLight,
        accent
    } = useCreateProjectModal({ currentUser, onCreate, onClose });

    if (!isOpen) return null;

    // Styles
    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const borderColor = isLight ? 'border-slate-100' : 'border-white/5';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const inputBg = isLight ? 'bg-slate-50 border-transparent focus:bg-white focus:border-brand-500' : 'bg-black/20 border-transparent focus:bg-black/40 focus:border-brand-500';

    const selectBg = isLight
        ? 'bg-slate-50 border-transparent text-slate-700 focus:bg-white focus:border-brand-500'
        : 'bg-black/20 border-transparent text-zinc-300 focus:bg-black/40 focus:border-brand-500';

    const optionClass = isLight ? 'bg-white' : 'bg-[#18181b]';

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border ${isLight ? 'border-slate-200' : 'border-white/10'}`} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={`px-8 py-6 border-b flex justify-between items-center sticky top-0 z-10 shrink-0 ${modalBg} ${borderColor}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shadow-sm border ${isLight ? `bg-${accent}-50 text-${accent}-600 border-${accent}-100` : `bg-${accent}-500/10 text-${accent}-400 border-${accent}-500/20`}`}>
                            <Rocket size={24} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-xl tracking-tight ${textPrimary}`}>{t('modal.createProject.title')}</h3>
                            <p className={`text-xs font-medium ${textSecondary}`}>{t('modal.createProject.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-50' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}><X size={24} /></button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <form id="create-project-form" onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="space-y-3">
                            <label className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{t('modal.createProject.projectTitle')}</label>
                            <div className="relative group">
                                <Type className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isLight ? 'text-slate-400 group-focus-within:text-brand-500' : 'text-zinc-500 group-focus-within:text-brand-400'}`} size={20} />
                                <input
                                    type="text"
                                    value={newProjectData.title}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewProjectData((prev: CreateProjectState) => ({ ...prev, title: val }));
                                    }}
                                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all font-semibold ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-black/20 text-white placeholder:text-zinc-600'} ${inputBg}`}
                                    placeholder={t('modal.createProject.placeholderTitle')}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{t('modal.createProject.jobDescription')}</label>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isLight ? 'bg-violet-50 border-violet-100 text-violet-700' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
                                    <Sparkles size={12} className="fill-current" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{t('modal.createProject.aiContext')}</span>
                                </div>
                            </div>
                            <div className="group relative">
                                <div className={`
                                  rounded-2xl border transition-all duration-300 overflow-hidden
                                  ${isLight ? 'bg-slate-50 border-slate-200 focus-within:bg-white' : 'bg-black/20 border-white/5 focus-within:bg-black/40'}
                                  focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10
                              `}>
                                    <textarea
                                        value={newProjectData.description}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewProjectData((prev: CreateProjectState) => ({ ...prev, description: val }));
                                        }}
                                        className={`w-full px-5 py-4 border-none focus:ring-0 h-64 resize-none text-sm leading-relaxed custom-scrollbar bg-transparent ${isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-zinc-200 placeholder:text-zinc-600'}`}
                                        placeholder={t('modal.createProject.placeholderDesc')}
                                        required
                                    />
                                    <div className={`px-4 py-2.5 border-t text-[11px] font-medium flex justify-between items-center ${isLight ? 'bg-slate-50/50 border-slate-100 text-slate-400' : 'bg-white/[0.02] border-white/5 text-zinc-500'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                                            <span>{t('modal.createProject.optimizedForAI')}</span>
                                        </div>
                                        <span>{newProjectData.description.length} {t('modal.createProject.chars')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Config Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

                            {/* Outreach Policy (New) */}
                            <div className="space-y-3 md:col-span-2">
                                <label className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                    <Mail size={16} /> {t('modal.createProject.outreachIdentity')}
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setNewProjectData(prev => ({ ...prev, outreachStrategy: OutreachStrategy.OWNER_IDENTITY }))}
                                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${newProjectData.outreachStrategy === OutreachStrategy.OWNER_IDENTITY
                                            ? (isLight ? `bg-${accent}-50 border-${accent}-500 shadow-sm` : `bg-${accent}-500/10 border-${accent}-500 shadow-[0_0_15px_-5px_rgba(var(--color-${accent}-500),0.3)]`)
                                            : (isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-black/20 border-white/10 hover:bg-white/5')
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-1.5 rounded-lg ${newProjectData.outreachStrategy === OutreachStrategy.OWNER_IDENTITY ? (isLight ? 'bg-white text-black' : `bg-${accent}-500 text-white`) : (isLight ? 'bg-slate-200 text-slate-500' : 'bg-white/10 text-zinc-400')}`}>
                                                <Shield size={16} />
                                            </div>
                                            {newProjectData.outreachStrategy === OutreachStrategy.OWNER_IDENTITY && <div className={`p-0.5 rounded-full ${isLight ? `bg-${accent}-200 text-${accent}-700` : `bg-${accent}-500 text-white`}`}><Check size={10} strokeWidth={4} /></div>}
                                        </div>
                                        <div className={`font-bold text-xs mb-1 ${newProjectData.outreachStrategy === OutreachStrategy.OWNER_IDENTITY ? `text-${accent}-500` : textPrimary}`}>{t('modal.createProject.centralized')}</div>
                                        <p className={`text-[10px] ${textSecondary}`}>{t('modal.createProject.centralizedDesc')}</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewProjectData(prev => ({ ...prev, outreachStrategy: OutreachStrategy.INDIVIDUAL_IDENTITY }))}
                                        className={`relative p-4 rounded-xl border-2 text-left transition-all group ${newProjectData.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY
                                            ? (isLight ? `bg-${accent}-50 border-${accent}-500 shadow-sm` : `bg-${accent}-500/10 border-${accent}-500 shadow-[0_0_20px_-10px_rgba(var(--color-${accent}-500),0.3)]`)
                                            : (isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-black/20 border-white/10 hover:bg-white/5')
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-1.5 rounded-lg ${newProjectData.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY ? (isLight ? 'bg-white text-black' : `bg-${accent}-500 text-white`) : (isLight ? 'bg-slate-200 text-slate-500' : 'bg-white/10 text-zinc-400')}`}>
                                                <Users size={16} />
                                            </div>
                                            {newProjectData.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY && <div className={`p-0.5 rounded-full ${isLight ? `bg-${accent}-200 text-${accent}-700` : `bg-${accent}-500 text-white`}`}><Check size={10} strokeWidth={4} /></div>}
                                        </div>
                                        <div className={`font-bold text-xs mb-1 ${newProjectData.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY ? `text-${accent}-500` : textPrimary}`}>{t('modal.createProject.decentralized')}</div>
                                        <p className={`text-[10px] ${textSecondary}`}>{t('modal.createProject.decentralizedDesc')}</p>
                                    </button>
                                </div>

                                {/* If Centralized, show Email Selector or Redirect */}
                                {newProjectData.outreachStrategy === OutreachStrategy.OWNER_IDENTITY && (
                                    <div className={`animate-fade-in mt-3 p-4 rounded-xl border border-dashed ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/5 border-white/10'}`}>
                                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSecondary}`}>{t('modal.createProject.selectSender')}</label>

                                        {(!currentUser.emailIntegrations || currentUser.emailIntegrations.length === 0) ? (
                                            <div className={`flex items-center justify-between p-3 rounded-lg border ${isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                <span className="text-xs font-bold flex items-center gap-2">
                                                    <Ghost size={14} /> {t('modal.createProject.noEmails')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigate('profile')}
                                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${isLight ? 'bg-white border border-red-100 hover:bg-red-50' : 'bg-red-500/20 hover:bg-red-500/30'}`}
                                                >
                                                    {t('modal.createProject.connectProfile')} <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <AtSign className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                                                <select
                                                    value={newProjectData.ownerOutreachEmailId}
                                                    onChange={(e) => setNewProjectData(prev => ({ ...prev, ownerOutreachEmailId: e.target.value }))}
                                                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-${accent}-500 cursor-pointer transition-all ${inputBg}`}
                                                >
                                                    <option value="" disabled className={optionClass}>{t('modal.team.selectEmail')}</option>
                                                    {currentUser.emailIntegrations.map(email => (
                                                        <option key={email.id} value={email.id} className={optionClass}>
                                                            {email.emailAddress} ({email.provider})
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${textSecondary}`} size={16} />

                                                <p className={`text-[10px] mt-2 flex items-center gap-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                                                    <Check size={10} /> {t('modal.createProject.emailNote')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Initial Status */}
                            <div className="space-y-3">
                                <label className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{t('modal.createProject.initialStatus')}</label>
                                <div className="relative group">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-brand-500 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <select
                                        value={newProjectData.status}
                                        onChange={(e) => setNewProjectData(prev => ({ ...prev, status: e.target.value as any }))}
                                        className={`w-full pl-12 pr-10 py-3.5 rounded-xl border focus:outline-none focus:ring-4 focus:ring-brand-500/10 font-medium transition-all cursor-pointer ${selectBg}`}
                                    >
                                        <option value="ACTIVE" className={optionClass}>{t('modal.general.active')}</option>
                                        <option value="COMPLETED" className={optionClass}>{t('modal.general.completed')}</option>
                                        <option value="ARCHIVED" className={optionClass}>{t('modal.general.archived')}</option>
                                    </select>
                                    <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} size={16} />
                                </div>
                            </div>

                            {/* Billing Strategy */}
                            {currentUser.subscriptionPlan !== SubscriptionPlan.FREE && (
                                <div className="space-y-3">
                                    <label className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{t('modal.createProject.billingStrategy')}</label>
                                    <div className="relative group">
                                        <select
                                            value={newProjectData.billingMode}
                                            onChange={(e) => setNewProjectData(prev => ({
                                                ...prev,
                                                billingMode: e.target.value as ProjectBillingMode
                                            }))}
                                            className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none focus:ring-4 focus:ring-brand-500/10 font-medium transition-all cursor-pointer ${selectBg}`}
                                        >
                                            <option value="OWNER_WALLET" className={optionClass}>{t('modal.createProject.sharedWallet')}</option>
                                            <option value="PROJECT_INVESTMENT" className={optionClass}>{t('modal.createProject.dedicatedBudget')}</option>
                                        </select>
                                        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} size={16} />
                                    </div>
                                </div>
                            )}

                            {newProjectData.billingMode === 'PROJECT_INVESTMENT' && (
                                <div className={`space-y-3 md:col-span-2 p-4 rounded-xl border animate-fade-in ${isLight ? 'bg-amber-50 border-amber-100' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                    <label className={`text-sm font-bold ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>{t('modal.createProject.initialBudget')}</label>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            value={newProjectData.investmentBudget}
                                            onChange={(e) => setNewProjectData(prev => ({ ...prev, investmentBudget: parseInt(e.target.value) || 0 }))}
                                            className={`flex-1 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold ${isLight ? 'bg-white border-amber-200 text-slate-900' : 'bg-black/20 border-amber-500/30 text-white'}`}
                                            placeholder="Enter amount..."
                                        />
                                        <div className={`text-xs font-medium max-w-[200px] ${isLight ? 'text-amber-700' : 'text-amber-200/70'}`}>
                                            {t('modal.createProject.budgetNote', { balance: currentUser.scansBalance })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasQuotaFeature && (
                                <div className="space-y-3 md:col-span-2">
                                    <label className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{t('modal.createProject.memberQuota')}</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setNewProjectData((prev) => ({ ...prev, defaultScanQuota: 'UNLIMITED' }))}
                                            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${newProjectData.defaultScanQuota === 'UNLIMITED'
                                                ? (isLight ? `border-${accent}-500 bg-${accent}-50 text-${accent}-700 shadow-sm` : `border-${accent}-500 bg-${accent}-500/10 text-${accent}-400`)
                                                : (isLight ? 'border-slate-100 bg-white text-slate-500 hover:border-slate-200' : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10')
                                                }`}
                                        >
                                            <Infinity size={20} />
                                            <span className="font-bold text-sm">{t('modal.createProject.unlimited')}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newProjectData.defaultScanQuota === 'UNLIMITED') {
                                                    setNewProjectData((prev) => ({ ...prev, defaultScanQuota: 50 }));
                                                }
                                            }}
                                            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${newProjectData.defaultScanQuota !== 'UNLIMITED'
                                                ? (isLight ? `border-${accent}-500 bg-${accent}-50 text-${accent}-700 shadow-sm` : `border-${accent}-500 bg-${accent}-500/10 text-${accent}-400`)
                                                : (isLight ? 'border-slate-100 bg-white text-slate-500 hover:border-slate-200' : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10')
                                                }`}
                                        >
                                            <Calculator size={20} />
                                            <span className="font-bold text-sm">{t('modal.createProject.customLimit')}</span>
                                        </button>
                                    </div>

                                    {newProjectData.defaultScanQuota !== 'UNLIMITED' && (
                                        <div className="relative animate-fade-in">
                                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                                                <Calculator size={18} />
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newProjectData.defaultScanQuota}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setNewProjectData(prev => ({
                                                        ...prev,
                                                        defaultScanQuota: isNaN(val) ? 0 : val
                                                    }));
                                                }}
                                                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all font-bold ${isLight ? `bg-white border-${accent}-100 focus:border-${accent}-500 focus:ring-${accent}-500/10 text-slate-900` : `bg-black/20 border-white/10 focus:border-${accent}-500 focus:ring-${accent}-500/20 text-white`}`}
                                                placeholder={t('modal.createProject.enterLimit')}
                                            />
                                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                                                {t('modal.createProject.scans')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>
                </div >

                {/* Footer */}
                < div className={`px-8 py-5 border-t flex justify-end gap-3 shrink-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-white/5'}`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-6 py-3 rounded-xl font-bold transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        {t('modal.createProject.cancel')}
                    </button>
                    <button
                        onClick={() => document.getElementById('create-project-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                        className={`px-8 py-3 rounded-xl bg-${accent}-600 text-white font-bold hover:bg-${accent}-500 shadow-lg shadow-${accent}-500/20 hover:shadow-${accent}-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2`}
                    >
                        <Rocket size={18} /> {t('modal.createProject.create')}
                    </button>
                </div >
            </div >
        </div >
    );
};

export default CreateProjectModal;
