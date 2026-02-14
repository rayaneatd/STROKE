
import React from 'react';
import { ShieldCheck, Lock, Activity, Ghost, Users, ShieldOff, KeyRound, Mail, AtSign, Check, ArrowRight, Shield, ChevronDown } from 'lucide-react';
import { Project, EmployeeAddPermission, DemoteTarget, OutreachStrategy, User, ProjectRole } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface TeamAccessTabProps {
    formData: Partial<Project>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Project>>>;
    isOwner: boolean;
    onNavigate: (page: string) => void;
    currentUser: User;
}

const TeamAccessTab: React.FC<TeamAccessTabProps> = ({ formData, setFormData, isOwner, onNavigate, currentUser }) => {
    const { isLight, accent } = useTheme();
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-black/20 border-white/10 text-white focus:bg-black/40';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const optionClass = isLight ? 'bg-white' : 'bg-[#18181b]';

    if (!formData.settings) return null;

    // Find owner from members or use currentUser if it's a new project being created by the user
    const ownerUser = formData.members?.find(m => m.role === ProjectRole.OWNER)?.user || (formData.ownerId === currentUser.id ? currentUser : null);

    const updateSetting = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings!, [key]: value }
        }));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${textPrimary}`}>
                    <ShieldCheck size={20} className="text-zinc-400" /> Team & Permissions
                </h2>

                <div className="space-y-6">

                    {/* Outreach / Identity Policy */}
                    <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Mail size={16} className={isLight ? 'text-slate-400' : 'text-zinc-500'} />
                            <label className={`text-sm font-bold ${textSecondary}`}>Outreach Identity Policy</label>
                        </div>

                        {isOwner ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updateSetting('outreachStrategy', OutreachStrategy.OWNER_IDENTITY)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all relative ${formData.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY
                                            ? `bg-${accent}-500/10 border-${accent}-500 ring-1 ring-${accent}-500/50`
                                            : isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Shield size={18} className={formData.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY ? `text-${accent}-500` : textSecondary} />
                                            {formData.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY && <div className={`p-0.5 rounded-full bg-${accent}-500 text-white`}><Check size={10} strokeWidth={4} /></div>}
                                        </div>
                                        <div className={`font-bold text-xs mb-1 ${formData.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY ? `text-${accent}-500` : textPrimary}`}>Centralized (Owner)</div>
                                        <p className="text-[10px] opacity-70">All emails sent via owner.</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updateSetting('outreachStrategy', OutreachStrategy.INDIVIDUAL_IDENTITY)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all relative ${formData.settings.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY
                                            ? `bg-${accent}-500/10 border-${accent}-500 ring-1 ring-${accent}-500/50`
                                            : isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Users size={18} className={formData.settings.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY ? `text-${accent}-500` : textSecondary} />
                                            {formData.settings.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY && <div className={`p-0.5 rounded-full bg-${accent}-500 text-white`}><Check size={10} strokeWidth={4} /></div>}
                                        </div>
                                        <div className={`font-bold text-xs mb-1 ${formData.settings.outreachStrategy === OutreachStrategy.INDIVIDUAL_IDENTITY ? `text-${accent}-500` : textPrimary}`}>Decentralized (User)</div>
                                        <p className="text-[10px] opacity-70">Users send via their own email.</p>
                                    </button>
                                </div>

                                {/* Centralized: Owner selects their email */}
                                {formData.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY && ownerUser && (
                                    <div className={`animate-fade-in mt-3 p-4 rounded-xl border border-dashed ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/5 border-white/10'}`}>
                                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSecondary}`}>Select Centralized Sender Address</label>

                                        {!ownerUser.emailIntegrations || ownerUser.emailIntegrations.length === 0 ? (
                                            <div className={`flex items-center justify-between p-3 rounded-lg border ${isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                <span className="text-xs font-bold flex items-center gap-2">
                                                    <ShieldOff size={14} /> No connected emails found.
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigate('profile')}
                                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${isLight ? 'bg-white border border-red-100 hover:bg-red-50' : 'bg-red-500/20 hover:bg-red-500/30'}`}
                                                >
                                                    Connect in Profile <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <AtSign className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                                                <select
                                                    value={formData.settings.ownerOutreachEmailId || ''}
                                                    onChange={(e) => updateSetting('ownerOutreachEmailId', e.target.value)}
                                                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-${accent}-500 cursor-pointer transition-all ${inputBg}`}
                                                >
                                                    <option value="" disabled className={optionClass}>Select an email...</option>
                                                    {ownerUser.emailIntegrations.map(email => (
                                                        <option key={email.id} value={email.id} className={optionClass}>
                                                            {email.emailAddress} ({email.provider})
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${textSecondary}`} size={16} />

                                                <p className={`text-[10px] mt-2 flex items-center gap-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                                                    <Check size={10} /> This email will be used for all project outreach.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs opacity-70 italic p-3 bg-white/5 rounded-lg border border-white/5">
                                {formData.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY
                                    ? "Emails are sent via the Project Owner's centralized address."
                                    : "Emails are sent via your own connected personal address."
                                }
                            </div>
                        )}
                    </div>

                    {/* Invitation Policy */}
                    <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Users size={16} className={isLight ? 'text-slate-400' : 'text-zinc-500'} />
                            <label className={`text-sm font-bold ${textSecondary}`}>Invitation Policy</label>
                        </div>
                        <select
                            value={formData.settings.employeeAddPermission}
                            onChange={(e) => updateSetting('employeeAddPermission', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-${accent}-500 font-medium text-sm cursor-pointer ${inputBg}`}
                        >
                            <option value={EmployeeAddPermission.ALL} className={optionClass}>Owner & Admin Connections</option>
                            <option value={EmployeeAddPermission.OWN_CONNECTIONS} className={optionClass}>Admin's Connections Only</option>
                            <option value={EmployeeAddPermission.OWNER_CONNECTIONS} className={optionClass}>Owner's Connections Only</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Toggles */}
                        <div
                            onClick={() => updateSetting('analystAccessOnlyForCompleted', !formData.settings?.analystAccessOnlyForCompleted)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.settings.analystAccessOnlyForCompleted ? 'bg-zinc-800 border-zinc-700 text-white shadow-md' : (isLight ? 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10')}`}
                        >
                            <div className="flex justify-between items-start mb-2"><Lock size={20} /> <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.settings.analystAccessOnlyForCompleted ? 'bg-emerald-500' : 'bg-zinc-600'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.settings.analystAccessOnlyForCompleted ? 'left-6' : 'left-1'}`}></div></div></div>
                            <h4 className="font-bold text-sm mb-1">Analyst-Only Completed</h4>
                            <p className="text-[10px] opacity-60">Hide completed projects from non-analysts.</p>
                        </div>

                        <div
                            onClick={() => updateSetting('adminCanChangeStatus', !formData.settings?.adminCanChangeStatus)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.settings.adminCanChangeStatus ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 shadow-md' : (isLight ? 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10')}`}
                        >
                            <div className="flex justify-between items-start mb-2"><ShieldCheck size={20} /> <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.settings.adminCanChangeStatus ? 'bg-emerald-500' : 'bg-zinc-600'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.settings.adminCanChangeStatus ? 'left-6' : 'left-1'}`}></div></div></div>
                            <h4 className="font-bold text-sm mb-1">Admin Status Control</h4>
                            <p className="text-[10px] opacity-60">Allow Admins to archive/complete.</p>
                        </div>

                        <div
                            onClick={() => updateSetting('analystCanViewActivity', !formData.settings?.analystCanViewActivity)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.settings.analystCanViewActivity ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 shadow-md' : (isLight ? 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10')}`}
                        >
                            <div className="flex justify-between items-start mb-2"><Activity size={20} /> <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.settings.analystCanViewActivity ? 'bg-emerald-500' : 'bg-zinc-600'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.settings.analystCanViewActivity ? 'left-6' : 'left-1'}`}></div></div></div>
                            <h4 className="font-bold text-sm mb-1">Analyst Audit View</h4>
                            <p className="text-[10px] opacity-60">Allow Analysts to see the Activity Tab.</p>
                        </div>

                        <div
                            onClick={() => updateSetting('analystCanUseGhosting', !formData.settings?.analystCanUseGhosting)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.settings.analystCanUseGhosting ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-md' : (isLight ? 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10')}`}
                        >
                            <div className="flex justify-between items-start mb-2"><Ghost size={20} /> <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.settings.analystCanUseGhosting ? 'bg-emerald-500' : 'bg-zinc-600'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.settings.analystCanUseGhosting ? 'left-6' : 'left-1'}`}></div></div></div>
                            <h4 className="font-bold text-sm mb-1">Analyst Ghosting Tool</h4>
                            <p className="text-[10px] opacity-60">Allow Analysts to use mass emails.</p>
                        </div>
                    </div>

                    <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldOff size={16} className={isLight ? 'text-slate-400' : 'text-zinc-500'} />
                            <label className={`text-sm font-bold ${textSecondary}`}>Quick Demote Target Role</label>
                        </div>
                        <select
                            value={formData.settings.quickDemoteTarget || 'VISITOR'}
                            onChange={(e) => updateSetting('quickDemoteTarget', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-${accent}-500 font-medium text-sm cursor-pointer ${inputBg}`}
                        >
                            <option value="PARTNER" className={optionClass}>Talent Partner (Full Access)</option>
                            <option value="SCOUT" className={optionClass}>Talent Scout (Scan Only)</option>
                            <option value="ANALYST" className={optionClass}>Talent Analyst (View Only)</option>
                            <option value="VISITOR" className={optionClass}>Visitor (Read Only)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamAccessTab;
