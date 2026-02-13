
import React from 'react';
import { User, SubscriptionPlan, Role } from '../types';
import {
    Camera, Save, Mail, User as UserIcon, Shield, CreditCard, Check,
    AlertCircle, Loader2, Building2, Server, Link, Plus, Trash2
} from 'lucide-react';
import { INDUSTRIES } from '../constants';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useProfile } from '../hooks/useProfile';

interface ProfileProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onNavigate: (page: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onNavigate }) => {
    const {
        formData,
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
        getPlanColor
    } = useProfile({ user, onUpdateUser, onNavigate });

    const cardBg = isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-[#0e0e10] border border-white/5';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const labelClass = isLight ? 'text-slate-400' : 'text-zinc-400';
    const inputClass = isLight
        ? 'bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-brand-500'
        : 'bg-black/20 border border-white/10 text-zinc-200 placeholder:text-zinc-700 focus:bg-black/40 focus:border-brand-500/50';

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-12">
            <div>
                <h1 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>My Profile</h1>
                <p className={`text-sm mt-1 ${textSecondary}`}>Manage your digital identity and communication channels</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Core Identity */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className={`${cardBg} rounded-2xl p-8 relative`}>

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
                                <h2 className={`text-xl font-bold ${textPrimary}`}>{user.displayName}</h2>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPlanColor(user.subscriptionPlan)}`}>{user.subscriptionPlan} Member</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${user.role === Role.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-zinc-400 border-white/10'}`}>{user.role}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} mb-4`}>Personal Information</h3>
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ml-1 ${labelClass}`}>Display Name</label>
                                    <div className="relative group">
                                        <UserIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-brand-400 transition-colors ${textSecondary}`} size={16} />
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 outline-none transition-all text-sm font-medium ${inputClass}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ml-1 ${labelClass}`}>Email Address</label>
                                    <div className="relative opacity-60">
                                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            disabled
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl cursor-not-allowed text-sm font-medium border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2" title="Managed in Security Settings">
                                            <Shield size={14} className={textSecondary} />
                                        </div>
                                    </div>
                                </div>


                            </div>

                            {/* Professional Details */}
                            <div className="space-y-4">
                                <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} mb-4`}>Professional Context</h3>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ml-1 ${labelClass}`}>Company Name</label>
                                    <div className="relative group">
                                        <Building2 className={`absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-brand-400 transition-colors ${textSecondary}`} size={16} />
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            placeholder="e.g. Acme Corp"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 outline-none transition-all text-sm font-medium ${inputClass}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ml-1 ${labelClass}`}>Primary Industry</label>
                                    <SearchableSelect
                                        options={INDUSTRIES}
                                        value={formData.industry}
                                        onChange={handleIndustryChange}
                                        icon={<Server size={16} />}
                                        className="w-full"
                                        placeholder="Select Industry..."
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
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Integrations & Status */}
                <div className="space-y-6">

                    {/* Anti-Ghosting / Email Integration Card */}
                    <div className={`${cardBg} rounded-2xl p-6 relative overflow-hidden group`}>
                        <div className={`absolute top-0 left-0 w-full h-1 ${user.emailIntegrations.length > 0 ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-xl ${user.emailIntegrations.length > 0 ? 'bg-emerald-500/10 text-emerald-500' : isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-zinc-500'}`}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${textPrimary}`}>Anti-Ghosting System</h3>
                                <p className={`text-[10px] ${textSecondary}`}>{user.emailIntegrations.length > 0 ? `${user.emailIntegrations.length} Account(s) Linked` : 'Not Connected'}</p>
                            </div>
                        </div>

                        <p className={`text-xs mb-6 leading-relaxed ${textSecondary}`}>
                            Connect your professional email to allow our AI to automate candidate outreach and prevent ghosting.
                        </p>

                        {user.emailIntegrations.length > 0 && (
                            <div className="space-y-3 mb-6">
                                {user.emailIntegrations.map((integration) => (
                                    <div key={integration.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                            <img src={`https://ui-avatars.com/api/?name=${integration.provider}&background=random`} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                            <div className="min-w-0 flex-1">
                                                <span className={`block text-xs font-bold truncate ${textPrimary}`} title={integration.emailAddress}>{integration.emailAddress}</span>
                                                <span className={`block text-[9px] ${textSecondary}`}>{integration.provider}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDisconnectAccount(integration.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors shrink-0">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(!isTeamPlan && user.emailIntegrations.length > 0) ? (
                            <button
                                disabled
                                className={`w-full py-2.5 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 transition-all opacity-60 cursor-not-allowed ${isLight ? 'border-slate-300 text-slate-400' : 'border-white/20 text-zinc-600'}`}
                            >
                                <Lock size={12} /> Connect multiple accounts
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${isLight ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                    Requires Team Plan
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={handleConnectNylas}
                                disabled={isNylasConnecting}
                                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${user.emailIntegrations.length > 0 ? (isLight ? 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white') : (isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200')}`}
                            >
                                {isNylasConnecting ? <Loader2 size={14} className="animate-spin" /> : user.emailIntegrations.length > 0 ? <Plus size={14} /> : <Link size={14} />}
                                {user.emailIntegrations.length > 0 ? 'Connect Another Account' : 'Connect Professional Email'}
                            </button>
                        )}
                    </div>

                    {/* Plan Info */}
                    <div className={`${cardBg} rounded-2xl p-6`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`font-bold text-sm ${textPrimary}`}>Current Plan</h3>
                            <button
                                onClick={() => onNavigate('upgrade-plan')}
                                className={`text-xs font-bold text-${accentColor}-500 hover:underline`}
                            >
                                Upgrade
                            </button>
                        </div>

                        <div className={`p-4 rounded-xl mb-4 border relative overflow-hidden ${getPlanColor(user.subscriptionPlan)}`}>
                            <div className="relative z-10 flex items-center gap-3">
                                <CreditCard size={20} />
                                <div>
                                    <div className="text-sm font-black uppercase tracking-wide">{user.subscriptionPlan} TIER</div>
                                    <div className="text-[10px] opacity-80">Renews on Nov 1, 2024</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className={textSecondary}>Projects</span>
                                <span className={`font-bold ${textPrimary}`}>{user.subscriptionPlan === 'FREE' ? '1 / 3' : 'Unlimited'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className={textSecondary}>Scans / Mo</span>
                                <span className={`font-bold ${textPrimary}`}>{user.scansBalance} Remaining</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
