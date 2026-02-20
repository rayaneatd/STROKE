
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Crown, Shield, Briefcase, User, Search, ChevronUp, ChevronDown, UserPlus, Settings,
    ShieldOff, ShieldCheck, Trash2, X, CheckSquare, Square, MinusSquare, BarChart2, CheckCircle, Loader2, ArrowDown, Edit2, Calculator, Infinity, Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project, User as UserType, ProjectRole, EmployeeAddPermission, DemoteTarget, ProjectPermission, SubscriptionPlan } from '../../types';
import BulkAccessModal from '../../components/modals/BulkAccessModal';
import BulkDemoteModal from '../../components/modals/BulkDemoteModal';
import BulkRemoveMemberModal from '../../components/modals/BulkRemoveMemberModal';

// Theme helper
const useTheme = (user: UserType) => {
    const isLight = user.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = user.preferences?.uiConfig?.accentColor || 'blue';
    return { isLight, accentColor };
};

// --- SUB COMPONENTS (Local to TeamTab) ---

const TeamListSection = React.memo(({
    title,
    members,
    icon,
    isExpanded,
    toggleExpand,
    showScans,
    onAdd,
    addLabel,
    className = "",
    canSelect,
    selectedMemberIds,
    toggleSelectAll,
    toggleMemberSelection,
    currentUser,
    teamSearch,
    userMap
}: any) => {
    const { t } = useTranslation();
    const [overflowVisible, setOverflowVisible] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const { isLight, accentColor } = useTheme(currentUser);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (isExpanded) {
            timeout = setTimeout(() => {
                setOverflowVisible(true);
            }, 300);
        } else {
            setOverflowVisible(false);
            setVisibleCount(10);
        }
        return () => clearTimeout(timeout);
    }, [isExpanded]);

    const filteredMembers = useMemo(() => {
        if (!teamSearch) return members;
        return members.filter((m: any) => {
            const user = userMap.get(m.userId);
            if (!user) return false;
            return (user.displayName.toLowerCase().includes(teamSearch.toLowerCase()) || user.email.toLowerCase().includes(teamSearch.toLowerCase()));
        });
    }, [members, teamSearch, userMap]);

    const allMemberIds = useMemo(() => filteredMembers.map((m: any) => m.userId), [filteredMembers]);

    const allSelected = allMemberIds.length > 0 && allMemberIds.every((id: string) => selectedMemberIds.has(id));
    const someSelected = allMemberIds.some((id: string) => selectedMemberIds.has(id));

    // Lazy Loading Logic
    const visibleMembers = filteredMembers.slice(0, visibleCount);
    const hasMore = visibleCount < filteredMembers.length;

    const handleShowMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setVisibleCount(prev => prev + 20);
    };

    const containerClass = isLight
        ? 'bg-white border-slate-200 shadow-sm'
        : 'bg-[#0e0e10] border-white/5 shadow-sm';

    const headerClass = isLight ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' : 'bg-white/[0.02] border-white/5 hover:bg-white/5';
    const textPrimary = isLight ? 'text-slate-900' : 'text-zinc-200';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const dividerClass = isLight ? 'divide-slate-100' : 'divide-white/5';
    const itemHoverClass = isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5';

    return (
        <div className={`rounded-2xl border transition-all duration-300 relative ${className} ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'} ${containerClass} mb-6`}>
            <div className={`p-4 border-b flex justify-between items-center ${headerClass} ${toggleExpand ? 'cursor-pointer' : ''}`} onClick={toggleExpand ? toggleExpand : undefined}>
                <div className="flex items-center gap-3">
                    {canSelect && members.length > 0 && (
                        <div onClick={(e) => { e.stopPropagation(); toggleSelectAll(allMemberIds); }} className={`hover:text-${accentColor}-500 transition-colors ${textSecondary}`}>
                            {allSelected ? <CheckSquare size={18} className={`text-${accentColor}-500`} /> : someSelected ? <MinusSquare size={18} className={`text-${accentColor}-500`} /> : <Square size={18} />}
                        </div>
                    )}
                    <h3 className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                        {icon}
                        {title}
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-zinc-400'}`}>{filteredMembers.length}</span>
                    </h3>
                    {toggleExpand && <div className={textSecondary}>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>}
                </div>
                {onAdd && (
                    <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-transparent ${isLight ? `text-${accentColor}-600 hover:bg-${accentColor}-50 hover:border-${accentColor}-100` : `text-${accentColor}-400 hover:bg-${accentColor}-500/10 hover:border-${accentColor}-500/20`}`}>
                        <UserPlus size={14} /> {addLabel || t('project.team.addMember')}
                    </button>
                )}
            </div>

            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}>
                <div>
                    {filteredMembers.length === 0 ? (
                        <div className={`p-8 text-center text-sm ${textSecondary}`}>
                            {teamSearch ? t('project.team.empty.noMatch', { search: teamSearch }) : t('project.team.empty.noMembers')}
                        </div>
                    ) : (
                        <div className={`divide-y ${dividerClass}`}>
                            {visibleMembers.map((m: any) => {
                                const user = userMap.get(m.userId);
                                if (!user) return null;
                                const isSelf = user.id === currentUser.id;
                                const isOwner = m.role === ProjectRole.OWNER;

                                let roleLabel = t('project.team.roles.employee');
                                if (m.role === ProjectRole.OWNER) roleLabel = t('project.team.roles.owner');
                                else if (m.role === ProjectRole.ADMIN) roleLabel = t('project.team.roles.admin');
                                else {
                                    if (m.permissions.includes('SCAN') && m.permissions.includes('ANALYZE')) roleLabel = t('project.team.roles.partner');
                                    else if (m.permissions.includes('SCAN')) roleLabel = t('project.team.roles.scout');
                                    else if (m.permissions.includes('ANALYZE')) roleLabel = t('project.team.roles.analyst');
                                    else if (m.permissions.length === 0) roleLabel = t('project.team.roles.visitor');
                                    else roleLabel = t('project.team.roles.staff');
                                }

                                const isSelected = selectedMemberIds.has(m.userId);

                                return (
                                    <div key={m.userId} onClick={() => canSelect && !isSelf && toggleMemberSelection(m.userId)} className={`p-4 flex items-center justify-between transition-colors group relative ${itemHoverClass} ${isSelected ? (isLight ? `bg-${accentColor}-50` : `bg-${accentColor}-500/10`) : ''}`}>
                                        <div className="flex items-center gap-3">
                                            {canSelect && !isSelf && (
                                                <div className={`cursor-pointer hover:text-${accentColor}-500 transition-colors ${textSecondary}`}>
                                                    {isSelected ? <CheckSquare size={18} className={`text-${accentColor}-500`} /> : <Square size={18} />}
                                                </div>
                                            )}

                                            <div className="relative">
                                                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}`} className={`w-10 h-10 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`} alt="" loading="lazy" />
                                                {isOwner && <div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full p-0.5 border-2 border-[#0e0e10]"><Crown size={8} /></div>}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-sm flex items-center gap-2 ${textPrimary}`}>
                                                    {user.displayName}
                                                    {isSelf && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/10 text-zinc-400 border-white/5'}`}>{t('project.team.you')}</span>}
                                                </div>
                                                <div className={`text-xs flex items-center gap-1.5 ${textSecondary}`}>
                                                    {user.email}
                                                    <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                                                    <span className={`font-medium text-${accentColor}-500`}>{roleLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {showScans && (
                                                <div className="text-right hidden sm:block">
                                                    <div className={`text-xs font-medium uppercase ${textSecondary}`}>{t('project.team.scansUsed')}</div>
                                                    <div className={`font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{m.scansUsed}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Show More Button */}
                            {hasMore && (
                                <div className="p-2 text-center">
                                    <button
                                        onClick={handleShowMore}
                                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 w-full ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <ArrowDown size={14} /> {t('project.team.showMore', { count: filteredMembers.length - visibleCount })}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const EmployeeSubList = React.memo(({
    title,
    icon,
    members,
    emptyLabel,
    showScans,
    canManageTeam,
    selectedMemberIds,
    toggleSelectAll,
    toggleMemberSelection,
    currentUser,
    userMap,
    onEditQuota,
    canEditQuota,
    projectId
}: any) => {
    const { t } = useTranslation();
    const [visibleCount, setVisibleCount] = useState(5);
    const [editingQuotaId, setEditingQuotaId] = useState<string | null>(null);
    const [quotaInput, setQuotaInput] = useState('');
    const { isLight, accentColor } = useTheme(currentUser);

    if (members.length === 0) return null;

    const allMemberIds = members.map((m: any) => m.userId);
    const allSelected = allMemberIds.length > 0 && allMemberIds.every((id: string) => selectedMemberIds.has(id));
    const someSelected = allMemberIds.some((id: string) => selectedMemberIds.has(id));

    const visibleMembers = members.slice(0, visibleCount);
    const hasMore = visibleCount < members.length;

    const startEditingQuota = (userId: string, currentQuota: number | 'UNLIMITED') => {
        if (!canEditQuota) return;
        setEditingQuotaId(userId);
        setQuotaInput(currentQuota === 'UNLIMITED' || currentQuota === -1 || String(currentQuota) === '-1' ? '' : currentQuota.toString());
    };

    const saveQuota = (userId: string, val: number | 'UNLIMITED') => {
        onEditQuota(projectId, userId, val);
        setEditingQuotaId(null);
    };

    const saveFromInput = (userId: string) => {
        if (quotaInput.trim() === '' || quotaInput.toUpperCase() === 'UNLIMITED') {
            saveQuota(userId, 'UNLIMITED');
        } else {
            const num = parseInt(quotaInput) || 0;
            saveQuota(userId, num);
        }
    };

    const bgClass = isLight ? 'bg-slate-50/50' : 'bg-white/[0.02]';
    const cardClass = isLight ? 'bg-white border-slate-100 hover:border-slate-200' : 'bg-[#0e0e10] border-white/5 hover:border-white/10';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    return (
        <div className={`p-4 ${bgClass}`}>
            <div className="flex justify-between items-center mb-4">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${textSecondary}`}>
                    {icon} {title}
                </h4>
                {canManageTeam && (
                    <div onClick={(e) => { e.stopPropagation(); toggleSelectAll(allMemberIds); }} className={`cursor-pointer hover:text-${accentColor}-400 transition-colors ${textSecondary}`}>
                        {allSelected ? <CheckSquare size={16} className={`text-${accentColor}-500`} /> : someSelected ? <MinusSquare size={16} className={`text-${accentColor}-500`} /> : <Square size={16} />}
                    </div>
                )}
            </div>
            <div className="space-y-2">
                {visibleMembers.map((m: any) => {
                    const user = userMap.get(m.userId);
                    if (!user) return null;

                    const isSelf = user.id === currentUser.id;
                    let roleLabel = "";
                    if (m.permissions.includes('SCAN') && m.permissions.includes('ANALYZE')) roleLabel = t('project.team.roles.partner');
                    else if (m.permissions.includes('SCAN')) roleLabel = t('project.team.roles.scout');
                    else if (m.permissions.includes('ANALYZE')) roleLabel = t('project.team.roles.analyst');
                    else roleLabel = t('project.team.roles.staff');

                    const isSelected = selectedMemberIds.has(m.userId);
                    const isEditing = editingQuotaId === m.userId;

                    // Analyst Check (No SCAN permission)
                    const isAnalystOnly = m.permissions.includes('ANALYZE') && !m.permissions.includes('SCAN');
                    
                    // Exhaustion Check
                    const isExhausted = m.scanQuota !== 'UNLIMITED' && m.scanQuota !== -1 && String(m.scanQuota) !== '-1' && m.scansUsed >= m.scanQuota;
                    const usageColor = isExhausted ? 'text-red-500 font-bold' : (isLight ? 'text-slate-500' : 'text-zinc-400');
                    const borderColor = isExhausted ? 'border-red-500/50' : (isLight ? 'border-slate-100' : 'border-white/5');
                    const bgBadge = isExhausted ? (isLight ? 'bg-red-50' : 'bg-red-500/10') : (isLight ? 'bg-slate-50' : 'bg-white/5');

                    return (
                        <div key={m.userId} onClick={() => canManageTeam && !isSelf && toggleMemberSelection(m.userId)} className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between group relative cursor-pointer ${cardClass} ${isSelected ? `ring-1 ring-${accentColor}-500 border-${accentColor}-500` : ''}`}>
                            <div className="flex items-center gap-3 overflow-hidden mb-2 sm:mb-0">
                                {canManageTeam && !isSelf && (
                                    <div className={`hover:text-${accentColor}-400 transition-colors flex-shrink-0 ${textSecondary}`}>
                                        {isSelected ? <CheckSquare size={16} className={`text-${accentColor}-500`} /> : <Square size={16} />}
                                    </div>
                                )}
                                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}`} className={`w-8 h-8 rounded-full flex-shrink-0 border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`} alt="" loading="lazy" />
                                <div className="min-w-0">
                                    <div className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>{user.displayName}</div>
                                    <div className={`text-[11px] truncate leading-tight ${textSecondary}`}>{user.email}</div>
                                    <div className={`text-xs font-medium mt-0.5 ${roleLabel.includes('Partner') ? 'text-purple-500' : roleLabel.includes('Scout') ? `text-${accentColor}-500` : 'text-blue-500'}`}>{roleLabel}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-7 sm:ml-0">
                                {showScans && !isAnalystOnly && (
                                    <div className="flex items-center gap-2">
                                        <div onClick={(e) => e.stopPropagation()} className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 border ${bgBadge} ${usageColor} ${borderColor}`}>
                                            <span>{m.scansUsed}</span>
                                            <span className="opacity-50">/</span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 animate-fade-in">
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        placeholder="∞"
                                                        value={quotaInput}
                                                        onChange={(e) => setQuotaInput(e.target.value)}
                                                        onBlur={() => saveFromInput(m.userId)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveFromInput(m.userId)}
                                                        className={`w-14 text-xs border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-${accentColor}-500 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-black border-white/20 text-white'}`}
                                                    />
                                                    <button
                                                        onMouseDown={(e) => { e.preventDefault(); saveQuota(m.userId, 'UNLIMITED'); }}
                                                        className={`p-0.5 rounded transition-colors ${isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-600' : 'bg-white/10 hover:bg-white/20 text-zinc-400'}`}
                                                        title="Set to Unlimited"
                                                    >
                                                        <Infinity size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span
                                                    className={`cursor-pointer ${canEditQuota ? `hover:text-${accentColor}-500 font-bold` : ''}`}
                                                    onClick={() => startEditingQuota(m.userId, m.scanQuota)}
                                                    title={canEditQuota ? "Click to edit quota" : "Quota locked"}
                                                >
                                                    {m.scanQuota === 'UNLIMITED' || m.scanQuota === -1 || String(m.scanQuota) === '-1' ? <Infinity size={14} className="inline" /> : m.scanQuota}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {hasMore && (
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className={`w-full py-2 text-[10px] font-bold rounded-lg transition-colors mt-2 ${isLight ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'}`}
                    >
                        {t('project.team.showMore', { count: members.length - visibleCount })}
                    </button>
                )}
            </div>
        </div>
    );
});

// --- MAIN COMPONENT ---

interface TeamTabProps {
    project: Project;
    currentUser: UserType;
    isAdmin: boolean;
    isProjectOwner: boolean;
    canManageTeam: boolean;
    onAddMember: (role: ProjectRole) => void;
    removeMember: (userId: string) => void;
    updateMember: (params: { userId: string, data: any }) => void;
    updateProject: (data: any, options?: any) => void;
    isActionLoading: boolean;
}

const TeamTab: React.FC<TeamTabProps> = ({
    project,
    currentUser,
    isAdmin,
    isProjectOwner,
    canManageTeam,
    onAddMember,
    removeMember,
    updateMember,
    updateProject,
    isActionLoading
}) => {
    const { t } = useTranslation();
    const { isLight, accentColor } = useTheme(currentUser);

    const [isOwnerExpanded, setIsOwnerExpanded] = useState(true);
    const [expandAdmins, setExpandAdmins] = useState(true);
    const [expandEmployees, setExpandEmployees] = useState(true);
    const [expandVisitors, setExpandVisitors] = useState(true);
    const [employeesOverflowVisible, setEmployeesOverflowVisible] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [teamSearch, setTeamSearch] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

    // Modals
    const [isBulkAccessModalOpen, setIsBulkAccessModalOpen] = useState(false);
    const [isBulkDemoteModalOpen, setIsBulkDemoteModalOpen] = useState(false);
    const [isBulkRemoveModalOpen, setIsBulkRemoveModalOpen] = useState(false);

    // Mappings
    const userMap = useMemo(() => {
        const map = new Map<string, any>();
        project.members.forEach(m => {
            if (m.user) map.set(m.userId, m.user);
        });
        return map;
    }, [project.members]);

    const isReadOnly = !canManageTeam;
    const currentUserRole = project.members.find(m => m.userId === currentUser.id)?.role;
    const hasQuotaFeature = currentUser.subscriptionPlan === SubscriptionPlan.TEAM || currentUser.subscriptionPlan === SubscriptionPlan.ELITE;
    const canEditQuota = isProjectOwner || (isAdmin && project.settings.adminCanManageQuotas);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (expandEmployees) {
            timeout = setTimeout(() => {
                setEmployeesOverflowVisible(true);
            }, 300);
        } else {
            setEmployeesOverflowVisible(false);
        }
        return () => clearTimeout(timeout);
    }, [expandEmployees]);

    // Selection Logic
    const toggleMemberSelection = useCallback((userId: string) => {
        if (isReadOnly) return;

        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            const targetMember = project.members.find(m => m.userId === userId);
            if (!targetMember) return prev;

            // Ensure we don't mix Admin/Employee in selection
            if (prev.size > 0) {
                const firstId = prev.values().next().value;
                const firstMember = project.members.find(m => m.userId === firstId);
                if (firstMember && firstMember.role !== targetMember.role) {
                    return new Set([userId]);
                }
            }

            if (newSet.has(userId)) newSet.delete(userId);
            else newSet.add(userId);
            return newSet;
        });
    }, [project.members, isReadOnly]);

    const toggleSelectAll = useCallback((memberIds: string[]) => {
        if (isReadOnly || memberIds.length === 0) return;

        setSelectedMemberIds(prev => {
            const sampleId = memberIds[0];
            const sampleMember = project.members.find(m => m.userId === sampleId);
            if (!sampleMember) return prev;

            // Check if existing selection is compatible
            let newSet = new Set(prev);
            if (prev.size > 0) {
                const firstId = prev.values().next().value;
                const firstMember = project.members.find(m => m.userId === firstId);
                if (firstMember && firstMember.role !== sampleMember.role) {
                    newSet = new Set(); // Clear incompatible selection
                }
            }

            const allIn = memberIds.every(id => newSet.has(id));
            if (allIn) memberIds.forEach(id => newSet.delete(id));
            else memberIds.forEach(id => newSet.add(id));
            return newSet;
        });
    }, [project.members, isReadOnly]);

    const selectionType = useMemo(() => {
        if (selectedMemberIds.size === 0) return null;
        const firstId = Array.from(selectedMemberIds)[0];
        const member = project.members.find(m => m.userId === firstId);
        return member?.role === ProjectRole.ADMIN ? 'ADMIN' : 'EMPLOYEE';
    }, [selectedMemberIds, project.members]);

    // Actions
    const handleBulkRoleUpdate = (newRole: ProjectRole) => {
        selectedMemberIds.forEach(userId => {
            updateMember({ userId, data: { role: newRole } });
        });
        setSelectedMemberIds(new Set());
    };

    const handleBulkUpdateAccess = (target: DemoteTarget | string[]) => {
        let permissions: string[] = [];
        if (Array.isArray(target)) {
            permissions = target;
        } else {
            permissions = target === 'PARTNER' ? ['SCAN', 'ANALYZE'] :
                target === 'SCOUT' ? ['SCAN'] :
                    target === 'ANALYST' ? ['ANALYZE'] :
                        [];
        }

        selectedMemberIds.forEach(userId => {
            updateMember({ userId, data: { role: ProjectRole.EMPLOYEE, permissions } });
        });
        setIsBulkAccessModalOpen(false);
        setIsBulkDemoteModalOpen(false);
        setSelectedMemberIds(new Set());
    };

    const handleBulkRemove = () => {
        selectedMemberIds.forEach(userId => {
            removeMember(userId);
        });
        setIsBulkRemoveModalOpen(false);
        setSelectedMemberIds(new Set());
    };

    const handleQuickDemote = () => {
        const target = project.settings.quickDemoteTarget || 'VISITOR';
        handleBulkUpdateAccess(target);
    };

    const handleQuotaUpdate = (projectId: string, userId: string, quota: number | 'UNLIMITED') => {
        updateMember({ userId, data: { scan_quota: quota } });
    };

    const handleAddClick = (type: 'ADMIN' | 'EMPLOYEE' | 'VISITOR') => {
        onAddMember(type as ProjectRole);
    };

    const handleUpdatePermission = (perm: EmployeeAddPermission) => {
        if (project.settings?.employeeAddPermission === perm) {
            setSettingsOpen(false);
            return;
        }
        setIsSavingSettings(true);
        updateProject(
            { settings: { ...(project.settings || {}), employeeAddPermission: perm } },
            {
                onSuccess: () => {
                    setSettingsOpen(false);
                },
                onError: (error: any) => {
                    console.error("Failed to update settings:", error);
                },
                onSettled: () => {
                    setIsSavingSettings(false);
                }
            }
        );
    };

    const getGridClass = (cols: number) => {
        switch (cols) {
            case 3: return 'md:grid-cols-3';
            case 2: return 'md:grid-cols-2';
            default: return 'md:grid-cols-1';
        }
    };

    // Styles
    const containerBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const inputClass = isLight ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-brand-500' : 'bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus:ring-brand-500';
    const actionMenuBg = isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#18181b] border-white/10 shadow-xl';

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in relative pb-20">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className={`text-2xl font-bold ${textPrimary}`}>{t('project.team.title')}</h2>
                        <p className={`${textSecondary} mt-1`}>{t('project.team.subtitle')}</p>
                    </div>
                    {currentUserRole === ProjectRole.OWNER && (
                        <div className="relative z-50">
                            <button onClick={() => setSettingsOpen(!settingsOpen)} className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-colors shadow-sm ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'}`}>
                                {isSavingSettings ? <Loader2 size={16} className="animate-spin text-brand-500" /> : <Settings size={16} />}
                                {isSavingSettings ? t('project.team.saving') : t('project.team.accessSettings')}
                            </button>
                            {settingsOpen && (
                                <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl border p-4 animate-fade-in-up ${actionMenuBg}`}>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>{t('project.team.invitationPolicy')}</h4>
                                            <div className="space-y-2">
                                                {[
                                                    { val: EmployeeAddPermission.ALL, label: t('project.team.invitationOptions.ALL') },
                                                    { val: EmployeeAddPermission.OWN_CONNECTIONS, label: t('project.team.invitationOptions.OWN_CONNECTIONS') },
                                                    { val: EmployeeAddPermission.OWNER_CONNECTIONS, label: t('project.team.invitationOptions.OWNER_CONNECTIONS') }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={(e) => { e.stopPropagation(); handleUpdatePermission(opt.val); }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${project.settings?.employeeAddPermission === opt.val ? `bg-${accentColor}-500/10 text-${accentColor}-500 font-bold border border-${accentColor}-500/20` : isLight ? 'text-slate-500 hover:bg-slate-50' : 'text-zinc-400 hover:bg-white/5'}`}
                                                    >
                                                        {opt.label}
                                                        {project.settings?.employeeAddPermission === opt.val && <CheckCircle size={14} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={18} />
                    <input
                        type="text"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder={t('project.team.searchPlaceholder')}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 shadow-sm ${inputClass}`}
                    />
                    {teamSearch && (
                        <button onClick={() => setTeamSearch('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-white'}`}>
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <TeamListSection
                    title="Project Owner"
                    members={project.members.filter(m => m.role === ProjectRole.OWNER)}
                    icon={<Crown size={18} className="text-yellow-500 fill-current" />}
                    isExpanded={isOwnerExpanded}
                    toggleExpand={() => setIsOwnerExpanded(!isOwnerExpanded)}
                    showScans={true}
                    canSelect={false}
                    selectedMemberIds={selectedMemberIds}
                    toggleSelectAll={toggleSelectAll}
                    toggleMemberSelection={toggleMemberSelection}
                    currentUser={currentUser}
                    teamSearch={teamSearch}
                    userMap={userMap}
                />

                <TeamListSection
                    title="Admins"
                    members={project.members.filter(m => m.role === ProjectRole.ADMIN)}
                    icon={<Shield size={18} className={`text-${accentColor}-500`} />}
                    isExpanded={expandAdmins}
                    toggleExpand={() => setExpandAdmins(!expandAdmins)}
                    showScans={true}
                    onAdd={(currentUserRole === ProjectRole.OWNER) ? () => handleAddClick('ADMIN') : undefined}
                    addLabel="Add Admin"
                    canSelect={currentUserRole === ProjectRole.OWNER && !isReadOnly}
                    selectedMemberIds={selectedMemberIds}
                    toggleSelectAll={toggleSelectAll}
                    toggleMemberSelection={toggleMemberSelection}
                    currentUser={currentUser}
                    teamSearch={teamSearch}
                    userMap={userMap}
                />

                <div className={`${containerBg} rounded-2xl border transition-all duration-300 relative z-20 ${employeesOverflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}>
                    <div
                        className={`p-4 border-b flex justify-between items-center cursor-pointer ${isLight ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'}`}
                        onClick={() => setExpandEmployees(!expandEmployees)}
                    >
                        <div className="flex items-center gap-3">
                            <h3 className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                                <Briefcase size={18} className={textSecondary} />
                                Employees
                                <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-zinc-400'}`}>
                                    {project.members.filter(m => m.role === ProjectRole.EMPLOYEE && m.permissions.length > 0).length}
                                </span>
                            </h3>
                            <div className={textSecondary}>{expandEmployees ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                        </div>
                        {(canManageTeam && (currentUserRole === ProjectRole.OWNER || currentUserRole === ProjectRole.ADMIN)) && (
                            <button onClick={(e) => { e.stopPropagation(); handleAddClick('EMPLOYEE'); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-transparent ${isLight ? `text-${accentColor}-600 hover:bg-${accentColor}-50 hover:border-${accentColor}-100` : `text-${accentColor}-400 hover:bg-${accentColor}-500/10 hover:border-${accentColor}-500/20`}`}>
                                <UserPlus size={14} /> Add Employee
                            </button>
                        )}
                    </div>

                    <div className={`transition-all duration-300 ease-in-out ${expandEmployees ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} ${employeesOverflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}>
                        {(() => {
                            const hasScouts = project.members.some(m => m.role === ProjectRole.EMPLOYEE && m.permissions.includes('SCAN') && !m.permissions.includes('ANALYZE'));
                            const hasPartners = project.members.some(m => m.role === ProjectRole.EMPLOYEE && m.permissions.includes('SCAN') && m.permissions.includes('ANALYZE'));
                            const hasAnalysts = project.members.some(m => m.role === ProjectRole.EMPLOYEE && m.permissions.includes('ANALYZE') && !m.permissions.includes('SCAN'));

                            const activeCols = [hasScouts, hasPartners, hasAnalysts].filter(Boolean).length;

                            if (activeCols === 0) return (
                                <div className={`p-8 text-center text-sm italic ${textSecondary}`}>
                                    No active employees found. Add members to assign roles.
                                </div>
                            );

                            return (
                                <div className={`grid grid-cols-1 ${getGridClass(activeCols)} divide-y md:divide-y-0 md:divide-x ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                                    <EmployeeSubList
                                        title="Talent Scouts"
                                        icon={<Search size={14} />}
                                        members={project.members.filter(m => m.role === ProjectRole.EMPLOYEE && m.permissions.includes('SCAN') && !m.permissions.includes('ANALYZE'))}
                                        showScans={true}
                                        canManageTeam={canManageTeam && (currentUserRole === ProjectRole.OWNER || currentUserRole === ProjectRole.ADMIN)}
                                        selectedMemberIds={selectedMemberIds}
                                        toggleSelectAll={toggleSelectAll}
                                        toggleMemberSelection={toggleMemberSelection}
                                        currentUser={currentUser}
                                        userMap={userMap}
                                        onEditQuota={handleQuotaUpdate}
                                        canEditQuota={canEditQuota}
                                        projectId={project.id}
                                    />
                                    <EmployeeSubList
                                        title="Talent Partners"
                                        icon={<Briefcase size={14} />}
                                        members={project.members.filter(m => m.role === ProjectRole.EMPLOYEE && m.permissions.includes('SCAN') && m.permissions.includes('ANALYZE'))}
                                        showScans={true}
                                        canManageTeam={canManageTeam && (currentUserRole === ProjectRole.OWNER || currentUserRole === ProjectRole.ADMIN)}
                                        selectedMemberIds={selectedMemberIds}
                                        toggleSelectAll={toggleSelectAll}
                                        toggleMemberSelection={toggleMemberSelection}
                                        currentUser={currentUser}
                                        userMap={userMap}
                                        onEditQuota={handleQuotaUpdate}
                                        canEditQuota={canEditQuota}
                                        projectId={project.id}
                                    />
                                    <EmployeeSubList
                                        title="Talent Analysts"
                                        icon={<BarChart2 size={14} />}
                                        members={project.members.filter(m => m.role === ProjectRole.EMPLOYEE && m.permissions.includes('ANALYZE') && !m.permissions.includes('SCAN'))}
                                        showScans={false}
                                        canManageTeam={canManageTeam && (currentUserRole === ProjectRole.OWNER || currentUserRole === ProjectRole.ADMIN)}
                                        selectedMemberIds={selectedMemberIds}
                                        toggleSelectAll={toggleSelectAll}
                                        toggleMemberSelection={toggleMemberSelection}
                                        currentUser={currentUser}
                                        userMap={userMap}
                                        onEditQuota={handleQuotaUpdate}
                                        canEditQuota={canEditQuota}
                                        projectId={project.id}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <TeamListSection
                    title="Visitors"
                    members={project.members.filter(m => m.role === ProjectRole.EMPLOYEE && m.permissions.length === 0)}
                    icon={<User size={18} className="text-zinc-400" />}
                    isExpanded={expandVisitors}
                    toggleExpand={() => setExpandVisitors(!expandVisitors)}
                    showScans={false}
                    onAdd={(currentUserRole === ProjectRole.OWNER || currentUserRole === ProjectRole.ADMIN) ? () => handleAddClick('VISITOR') : undefined}
                    addLabel="Add Visitor"
                    canSelect={canManageTeam && (currentUserRole === ProjectRole.OWNER || currentUserRole === ProjectRole.ADMIN)}
                    selectedMemberIds={selectedMemberIds}
                    toggleSelectAll={toggleSelectAll}
                    toggleMemberSelection={toggleMemberSelection}
                    currentUser={currentUser}
                    teamSearch={teamSearch}
                    userMap={userMap}
                />
            </div>

            {selectedMemberIds.size > 0 && !isReadOnly && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 p-2 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-fade-in-up border backdrop-blur-xl ${isLight ? 'bg-white/90 border-slate-200/60 shadow-slate-200/50' : 'bg-[#18181b]/90 text-white border-white/10 shadow-black/50'}`}>
                    <div className={`flex items-center gap-3 px-4 py-2 border-r ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                        <div className={`text-xs font-bold px-2 py-0.5 rounded text-white bg-${accentColor}-600 shadow-sm`}>
                            {selectedMemberIds.size}
                        </div>
                        <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-zinc-200'}`}>Selected</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {selectionType === 'EMPLOYEE' && (
                            <>
                                <button
                                    onClick={() => handleBulkRoleUpdate(ProjectRole.ADMIN)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-zinc-300'}`}
                                >
                                    <Shield size={16} /> Promote to Admin
                                </button>
                                <button
                                    onClick={() => setIsBulkAccessModalOpen(true)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isLight ? `bg-${accentColor}-50 text-${accentColor}-700 hover:bg-${accentColor}-100` : `bg-${accentColor}-500/10 text-${accentColor}-400 hover:bg-${accentColor}-500/20`}`}
                                >
                                    <Briefcase size={16} /> Configure Access
                                </button>
                            </>
                        )}

                        {selectionType === 'ADMIN' && (
                            <>
                                <button
                                    onClick={handleQuickDemote}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-zinc-300'}`}
                                >
                                    <Zap size={16} className="text-orange-500" /> Quick Demote
                                </button>
                                <button
                                    onClick={() => setIsBulkDemoteModalOpen(true)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isLight ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'}`}
                                >
                                    <ShieldOff size={16} /> Demote to...
                                </button>
                            </>
                        )}

                        <div className={`w-px h-6 mx-2 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                        <button
                            onClick={() => setIsBulkRemoveModalOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-red-500 hover:bg-red-500/10`}
                        >
                            <Trash2 size={16} /> Remove
                        </button>
                    </div>

                    <button
                        onClick={() => setSelectedMemberIds(new Set())}
                        className={`ml-1 p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-zinc-400'}`}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <BulkAccessModal
                isOpen={isBulkAccessModalOpen}
                onClose={() => setIsBulkAccessModalOpen(false)}
                selectedCount={selectedMemberIds.size}
                onConfirm={handleBulkUpdateAccess}
            />

            <BulkDemoteModal
                isOpen={isBulkDemoteModalOpen}
                onClose={() => setIsBulkDemoteModalOpen(false)}
                selectedCount={selectedMemberIds.size}
                onConfirm={handleBulkUpdateAccess}
            />

            <BulkRemoveMemberModal
                isOpen={isBulkRemoveModalOpen}
                onClose={() => setIsBulkRemoveModalOpen(false)}
                selectedCount={selectedMemberIds.size}
                onConfirm={handleBulkRemove}
            />
        </div>
    );
};

export default TeamTab;
