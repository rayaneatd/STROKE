
import React from 'react';
import { User, Role, SubscriptionPlan } from '../types';
import {
    Camera, Save, Mail, User as UserIcon, Shield, CreditCard, Check,
    AlertCircle, Loader2, Building2, Server, Link, Plus, Trash2,
    Briefcase, Calendar, Edit2, X, AlertTriangle
} from 'lucide-react';
import { INDUSTRIES } from '../constants';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../context/ThemeContext';
import ThemedButton from '../components/ui/ThemedButton';
import { useTranslation } from 'react-i18next';

interface ProfileProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onNavigate: (page: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user: initialUser, onUpdateUser, onNavigate }) => {
    const { t, i18n } = useTranslation();
    const { styles } = useTheme();
    
    const {
        user,
        formData,
        linkedAccounts,
        hasLinkedAccounts,
        isNylasConnecting,
        isLoading,
        message,
        fileInputRef,
        isLight,
        accentColor,
        isTeamPlan,
        handleChange,
        handleIndustryChange,
        handleAvatarClick,
        handleFileChange,
        handleSubmit,
        handleConnectNylas,
        handleDisconnectAccount,
        getPlanColor,
        primaryEmailInput,
        setPrimaryEmailInput,
        isEditingPrimary,
        setIsEditingPrimary,
        isSavingPrimary,
        emailError,
        emailSuccess,
        handleUpdateProfileEmail,
        isWorkEmailModalOpen,
        setIsWorkEmailModalOpen,
        workEmailError,
        workEmailSuccess,
        handleRemoveWorkMail,
        handleConnectAurinko
    } = useProfile({ user: initialUser, onUpdateUser, onNavigate });

    // Use the fetched user or fallback to initial
    const currentUser = user || initialUser;

    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const labelClass = isLight ? 'text-slate-400' : 'text-zinc-400';
    const inputClass = isLight
        ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-brand-500'
        : 'bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-700 focus:bg-black/40 focus:border-brand-500/50';

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-12">
            <div>
                <h1 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>{t('profile.title')}</h1>
                <p className={`text-sm mt-1 ${textSecondary}`}>{t('profile.description')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Core Identity */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className={`border rounded-2xl p-8 relative ${cardBg}`}>
                        
                        {/* Header / Avatar */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 border-b border-white/5 pb-8">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg ${isLight ? 'border-white bg-white shadow-slate-200' : 'border-[#18181b] bg-black shadow-black/50'}`}>
                                    <img
                                        src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${formData.displayName}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                                <div className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 ${isLight ? 'bg-white border-slate-100 text-slate-600' : 'bg-[#18181b] border-black text-white'}`}>
                                    <Camera size={14} />
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className={`text-xl font-bold ${textPrimary}`}>{currentUser.displayName}</h2>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPlanColor(currentUser.subscriptionPlan)}`}>{t(`plans.${currentUser.subscriptionPlan.toLowerCase()}`)} {t('profile.member')}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${currentUser.role === Role.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-zinc-400 border-white/10'}`}>{t(`roles.${currentUser.role.toLowerCase()}`)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} mb-4`}>{t('profile.personalInfo')}</h3>
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ml-1 ${labelClass}`}>{t('profile.displayName')}</label>
                                    <div className="relative group">
                                        <UserIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-brand-400 transition-colors ${textSecondary}`} size={16} />
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 outline-none transition-all text-sm font-medium border ${inputClass}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className="space-y-4">
                                <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} mb-4`}>{t('profile.professionalContext')}</h3>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ml-1 ${labelClass}`}>{t('profile.companyName')}</label>
                                    <div className="relative group">
                                        <Building2 className={`absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-brand-400 transition-colors ${textSecondary}`} size={16} />
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            placeholder={t('profile.companyPlaceholder')}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 outline-none transition-all text-sm font-medium border ${inputClass}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ml-1 ${labelClass}`}>{t('profile.industry')}</label>
                                    <SearchableSelect
                                        options={INDUSTRIES}
                                        value={formData.industry}
                                        onChange={handleIndustryChange}
                                        icon={<Server size={16} />}
                                        className="w-full"
                                        placeholder={t('profile.industryPlaceholder')}
                                        isLight={isLight}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`mt-8 pt-6 border-t flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                            {message ? (
                                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'} animate-fade-in`}>
                                    {message.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
                                    {message.text}
                                </div>
                            ) : <span></span>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait ${isLight ? `bg-${accentColor}-600 text-white hover:bg-${accentColor}-500 shadow-${accentColor}-200` : 'bg-white text-black shadow-white/10 hover:bg-zinc-200'}`}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                {t('profile.saveChanges')}
                            </button>
                        </div>
                    </form>

                    {/* Email Identity & Linked Accounts (Moved from SecuritySettings) */}
                    <div className="space-y-6">
                        {/* Linked Accounts */}
                        {hasLinkedAccounts && (
                            <div className={`border rounded-2xl p-6 ${cardBg}`}>
                                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
                                    <Shield size={20} className={textSecondary} />
                                    {t('profile.linkedAccounts')}
                                </h3>
                                <div className="space-y-3">
                                    {linkedAccounts.map((identity) => (
                                        <div key={identity.id} className={`flex items-center justify-between p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isLight ? 'bg-white shadow-sm' : 'bg-black/20'}`}>
                                                    <Shield size={20} className={textPrimary} />
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm capitalize ${textPrimary}`}>{identity.provider}</p>
                                                    <p className={`text-xs ${textSecondary}`}>{t('profile.lastSignIn', { date: new Date(identity.last_sign_in_at).toLocaleDateString(i18n.language) })}</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
                                                {t('profile.active')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Primary Email */}
                        <div className={`border rounded-2xl p-6 ${cardBg}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold flex items-center gap-2 ${textPrimary}`}>
                                    <Mail size={20} className={textSecondary} />
                                    {t('profile.primaryEmail')}
                                </h3>
                                {(emailError || emailSuccess) && (
                                    <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${emailSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {emailSuccess ? <Check size={12}/> : <AlertCircle size={12}/>}
                                        {emailSuccess || emailError}
                                    </div>
                                )}
                            </div>
                            
                            {!currentUser.primaryEmail && !currentUser.isOwner && (
                                <div className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 border ${isLight ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5"/> 
                                    <span>
                                        <strong>{t('profile.actionRequired')}</strong> {t('profile.addEmailMessage')}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <input 
                                    type="email" 
                                    value={primaryEmailInput}
                                    onChange={(e) => setPrimaryEmailInput(e.target.value)}
                                    disabled={!isEditingPrimary}
                                    placeholder="name@gmail.com"
                                    className={`flex-1 px-4 py-2.5 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass} ${!isEditingPrimary ? 'opacity-70 cursor-default' : ''}`}
                                />
                                {isEditingPrimary ? (
                                    <div className="flex gap-2">
                                        <ThemedButton variant="ghost" onClick={() => { setIsEditingPrimary(false); setPrimaryEmailInput(currentUser.primaryEmail || ''); }}>{t('profile.cancel')}</ThemedButton>
                                        <ThemedButton onClick={handleUpdateProfileEmail} isLoading={isSavingPrimary} icon={<Check size={16}/>}>{t('profile.save')}</ThemedButton>
                                    </div>
                                ) : (
                                    <ThemedButton variant="secondary" onClick={() => setIsEditingPrimary(true)} icon={<Edit2 size={14}/>}>{t('profile.edit')}</ThemedButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Work Emails & Status */}
                <div className="space-y-6">

                    {/* Work Emails Section (Replaces Anti-Ghosting) */}
                    <div className={`border rounded-2xl p-6 relative overflow-hidden group ${cardBg}`}>
                        <div className={`absolute top-0 left-0 w-full h-1 bg-indigo-500`}></div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-xl ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${textPrimary}`}>{t('profile.workEmails')}</h3>
                                <p className={`text-[10px] ${textSecondary}`}>{t('profile.workEmailsDescription')}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            {workEmailError || workEmailSuccess ? (
                                <div className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${workEmailSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {workEmailSuccess ? <Check size={12} /> : <AlertCircle size={12} />}
                                    {workEmailSuccess || workEmailError}
                                </div>
                            ) : null}

                            {(currentUser.workMails || []).length > 0 ? (
                                (currentUser.workMails || []).map((email) => (
                                    <div key={email} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                            <img src={`https://ui-avatars.com/api/?name=${email}&background=random`} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-bold truncate ${textPrimary}`}>{email}</p>
                                                <p className={`text-[10px] ${textSecondary}`}>{t('profile.workEmail')}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveWorkMail(email)}
                                            className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                        >
                                            <Trash2 size={12} /> {t('profile.remove')}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className={`text-xs text-center py-4 border border-dashed rounded-xl ${isLight ? 'border-slate-200 text-slate-400' : 'border-white/10 text-zinc-500'}`}>
                                    {t('profile.noWorkEmails')}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsWorkEmailModalOpen(true)}
                            className={`w-full py-2.5 rounded-xl border-2 border-dashed font-bold text-sm transition-all flex items-center justify-center gap-2 ${isLight ? 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50' : 'border-white/10 text-zinc-400 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                        >
                            <Plus size={16} /> {t('profile.addWorkEmail')}
                        </button>
                    </div>

                    {/* Plan Info */}
                    <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`font-bold text-sm ${textPrimary}`}>{t('profile.currentPlan')}</h3>
                            <button
                                onClick={() => onNavigate('upgrade-plan')}
                                className={`text-xs font-bold text-${accentColor}-500 hover:underline`}
                            >
                                {t('profile.upgrade')}
                            </button>
                        </div>

                        <div className={`p-4 rounded-xl mb-4 border relative overflow-hidden ${getPlanColor(currentUser.subscriptionPlan)}`}>
                            <div className="relative z-10 flex items-center gap-3">
                                <CreditCard size={20} />
                                <div>
                                    <div className="text-sm font-black uppercase tracking-wide">{t('profile.tier', { plan: currentUser.subscriptionPlan })}</div>
                                    <div className="text-[10px] opacity-80">{t('profile.renewsOn', { date: 'Nov 1, 2024' })}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className={textSecondary}>{t('profile.projects')}</span>
                                <span className={`font-bold ${textPrimary}`}>{currentUser.subscriptionPlan === 'FREE' ? '1 / 3' : t('profile.unlimited')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className={textSecondary}>{t('profile.scansPerMonth')}</span>
                                <span className={`font-bold ${textPrimary}`}>{t('profile.remaining', { count: currentUser.scansBalance })}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {isWorkEmailModalOpen && (
                <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-sm ${isLight ? 'bg-slate-900/30' : 'bg-black/70'}`}>
                    <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${cardBg}`}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <div>
                                <h3 className={`text-lg font-bold ${textPrimary}`}>{t('profile.connectWorkEmail')}</h3>
                                <p className={`text-xs ${textSecondary}`}>{t('profile.connectAurinkoDescription')}</p>
                            </div>
                            <button
                                onClick={() => setIsWorkEmailModalOpen(false)}
                                className={`p-2 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                                {t('profile.aurinkoDisclaimer')}
                            </div>
                            <button
                                onClick={handleConnectAurinko}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isLight ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-white text-black hover:bg-zinc-200'}`}
                            >
                                <Link size={16} /> {t('profile.connectAurinko')}
                            </button>
                            <button
                                onClick={() => setIsWorkEmailModalOpen(false)}
                                className={`w-full py-2 text-xs font-bold transition-colors ${isLight ? 'text-slate-500 hover:text-slate-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {t('profile.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
