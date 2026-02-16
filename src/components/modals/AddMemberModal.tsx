
import React from 'react';
import { UserPlus, X, Briefcase, Search, BarChart2, Check, Info, Loader2, ChevronDown } from 'lucide-react';
import { Project, User as UserType, ProjectRole } from '../../types';
import { useAddMemberModal } from '../../hooks/useAddMemberModal';
import { useTranslation } from 'react-i18next';

interface AddMemberModalProps {
    project: Project;
    currentUser: UserType;
    addMemberType: 'ADMIN' | 'EMPLOYEE' | 'VISITOR' | null;
    onClose: () => void;
    addMember: (params: { userId: string, role: ProjectRole, permissions: string[], quota: number | 'UNLIMITED' }) => void;
    isActionLoading: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
    project,
    currentUser,
    addMemberType,
    onClose,
    addMember,
    isActionLoading
}) => {
    const { t } = useTranslation();
    const {
        selectedUsersToAdd,
        selectedEmployeeSubRole,
        setSelectedEmployeeSubRole,
        availableUsers,
        toggleUserSelection,
        handleConfirm,
        isLoading,
        isLight,
        accent,
        orgFilter,
        setOrgFilter,
        orgOptions
    } = useAddMemberModal({
        project,
        currentUser,
        addMemberType,
        onClose,
        addMember,
        isActionLoading
    });

    if (!addMemberType) return null;

    // Styles
    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const borderColor = isLight ? 'border-slate-100' : 'border-white/10';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const sectionBg = isLight ? 'bg-slate-50/80' : 'bg-black/20';

    const getTitle = () => {
        if (addMemberType === 'ADMIN') return t('modal.addMember.titleAdmin');
        if (addMemberType === 'EMPLOYEE') return t('modal.addMember.titleEmployee');
        return t('modal.addMember.titleVisitor');
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] border ${isLight ? 'border-slate-200' : 'border-white/10'}`} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={`px-6 py-5 border-b flex justify-between items-center sticky top-0 z-10 shrink-0 ${modalBg} ${borderColor}`}>
                    <div>
                        <h3 className={`text-lg font-bold ${textPrimary}`}>{getTitle()}</h3>
                        <p className={`text-xs ${textSecondary}`}>{t('modal.addMember.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}><X size={20} /></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar: Role Selection (Only for EMPLOYEE) */}
                    {addMemberType === 'EMPLOYEE' && (
                        <div className={`w-80 shrink-0 border-r overflow-y-auto p-5 space-y-5 ${sectionBg} ${borderColor}`}>
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-3 ${textSecondary}`}>{t('modal.addMember.selectRole')}</label>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setSelectedEmployeeSubRole('PARTNER')}
                                        className={`w-full flex items-center p-3 rounded-xl border transition-all gap-3 text-left group ${selectedEmployeeSubRole === 'PARTNER'
                                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-500 ring-1 ring-purple-500/50 shadow-sm z-10'
                                            : isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-slate-50' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full shrink-0 transition-colors ${selectedEmployeeSubRole === 'PARTNER' ? 'bg-purple-500/20 text-purple-500' : isLight ? 'bg-slate-100 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500' : 'bg-white/5 text-zinc-500 group-hover:text-purple-400'}`}>
                                            <Briefcase size={18} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold block">{t('modal.addMember.roles.partner')}</span>
                                            <span className={`text-[10px] block opacity-70 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Full Access</span>
                                        </div>
                                        {selectedEmployeeSubRole === 'PARTNER' && <div className="ml-auto"><Check size={16} /></div>}
                                    </button>

                                    <button
                                        onClick={() => setSelectedEmployeeSubRole('SCOUT')}
                                        className={`w-full flex items-center p-3 rounded-xl border transition-all gap-3 text-left group ${selectedEmployeeSubRole === 'SCOUT'
                                            ? `bg-${accent}-500/10 border-${accent}-500/50 text-${accent}-500 ring-1 ring-${accent}-500/50 shadow-sm z-10`
                                            : isLight ? `bg-white border-slate-200 text-slate-600 hover:border-${accent}-300 hover:bg-slate-50` : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full shrink-0 transition-colors ${selectedEmployeeSubRole === 'SCOUT' ? `bg-${accent}-500/20 text-${accent}-500` : isLight ? `bg-slate-100 text-slate-400 group-hover:bg-${accent}-50 group-hover:text-${accent}-500` : `bg-white/5 text-zinc-500 group-hover:text-${accent}-400`}`}>
                                            <Search size={18} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold block">{t('modal.addMember.roles.scout')}</span>
                                            <span className={`text-[10px] block opacity-70 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Sourcing Focus</span>
                                        </div>
                                        {selectedEmployeeSubRole === 'SCOUT' && <div className="ml-auto"><Check size={16} /></div>}
                                    </button>

                                    <button
                                        onClick={() => setSelectedEmployeeSubRole('ANALYST')}
                                        className={`w-full flex items-center p-3 rounded-xl border transition-all gap-3 text-left group ${selectedEmployeeSubRole === 'ANALYST'
                                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 ring-1 ring-blue-500/50 shadow-sm z-10'
                                            : isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full shrink-0 transition-colors ${selectedEmployeeSubRole === 'ANALYST' ? 'bg-blue-500/20 text-blue-500' : isLight ? 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500' : 'bg-white/5 text-zinc-500 group-hover:text-blue-400'}`}>
                                            <BarChart2 size={18} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold block">{t('modal.addMember.roles.analyst')}</span>
                                            <span className={`text-[10px] block opacity-70 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Insights Focus</span>
                                        </div>
                                        {selectedEmployeeSubRole === 'ANALYST' && <div className="ml-auto"><Check size={16} /></div>}
                                    </button>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border text-xs leading-relaxed flex gap-3 animate-fade-in relative overflow-hidden ${isLight ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-blue-500/10 border-blue-500/20 text-zinc-400'}`}>
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <div className="shrink-0 mt-0.5 text-blue-500">
                                    <Info size={16} />
                                </div>
                                <div className="font-medium">
                                    {selectedEmployeeSubRole === 'PARTNER' && (
                                        <span>
                                            <strong className="block mb-1 opacity-80 uppercase tracking-wide">{t('modal.addMember.roleDetails.fullAccess')}</strong>
                                            {t('modal.addMember.roleDetails.partnerDesc')}
                                        </span>
                                    )}
                                    {selectedEmployeeSubRole === 'SCOUT' && (
                                        <span>
                                            <strong className="block mb-1 opacity-80 uppercase tracking-wide">{t('modal.addMember.roleDetails.sourcingFocus')}</strong>
                                            {t('modal.addMember.roleDetails.scoutDesc')}
                                        </span>
                                    )}
                                    {selectedEmployeeSubRole === 'ANALYST' && (
                                        <span>
                                            <strong className="block mb-1 opacity-80 uppercase tracking-wide">{t('modal.addMember.roleDetails.insightsFocus')}</strong>
                                            {t('modal.addMember.roleDetails.analystDesc')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right/Main Area: User List */}
                    <div className="flex-1 flex flex-col min-w-0 bg-inherit relative">
                        {orgOptions.length > 0 && (
                            <div className={`px-5 py-3 border-b ${borderColor} flex items-center gap-3`}>
                                <span className={`text-xs font-medium ${textSecondary}`}>Filter by Organization:</span>
                                <div className="relative flex-1 max-w-xs">
                                    <select
                                        value={orgFilter}
                                        onChange={(e) => setOrgFilter(e.target.value)}
                                        className={`w-full pl-3 pr-8 py-2 text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'}`}
                                    >
                                        <option className={isLight ? 'bg-white' : 'bg-[#18181b]'} value="ALL">{t('modal.addMember.allOrgs')}</option>
                                        {orgOptions.map((org) => (
                                            <option key={org} className={isLight ? 'bg-white' : 'bg-[#18181b]'} value={org}>{org}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] z-50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-2">
                            {availableUsers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                                        <UserPlus size={32} className={`opacity-50 ${textSecondary}`} />
                                    </div>
                                    <p className={`text-sm font-medium ${textSecondary}`}>{t('modal.addMember.noConnections')}</p>
                                    <p className={`text-xs mt-1 opacity-60 ${textSecondary}`}>{t('modal.addMember.connectMore')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {availableUsers.map(u => {
                                        const isSelected = selectedUsersToAdd.includes(u.id as unknown as string);
                                        return (
                                            <div
                                                key={u.id as unknown as string}
                                                onClick={() => toggleUserSelection(u.id as unknown as string)}
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border group ${isSelected ? (isLight ? `bg-${accent}-50 border-${accent}-200 shadow-sm` : `bg-${accent}-500/10 border-${accent}-500/30`) : (isLight ? 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200' : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10')}`}
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.displayName}`} className={`w-10 h-10 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`} alt="" />
                                                    <div className="min-w-0">
                                                        <div className={`text-sm font-bold truncate ${isSelected ? `text-${accent}-600` : textPrimary}`}>{u.displayName}</div>
                                                        <div className={`text-xs truncate ${textSecondary}`}>{u.email}</div>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 ${isSelected ? `bg-${accent}-500 border-${accent}-500 text-white scale-100` : (isLight ? 'border-slate-300 bg-white text-transparent group-hover:border-slate-400' : 'border-zinc-600 bg-transparent text-transparent group-hover:border-zinc-500')}`}>
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-5 border-t flex justify-between items-center shrink-0 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#18181b] border-white/5'}`}>
                     <div className={`text-xs font-medium ${textSecondary}`}>
                        {selectedUsersToAdd.length} user{selectedUsersToAdd.length !== 1 && 's'} selected
                     </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>{t('modal.addMember.cancel')}</button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedUsersToAdd.length === 0 || isLoading}
                            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none bg-${accent}-600 hover:bg-${accent}-500 shadow-${accent}-900/20`}
                        >
                            {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            {selectedUsersToAdd.length > 0 ? t('modal.addMember.addMembers', { count: selectedUsersToAdd.length }) : t('modal.addMember.addSelected')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
