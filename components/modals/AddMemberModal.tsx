
import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, X, Briefcase, Search, BarChart2, Check, Info, Loader2 } from 'lucide-react';
import { Project, User as UserType, ProjectRole, EmployeeAddPermission, ProjectPermission, Role, SubscriptionPlan, BillingType } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useConnections } from '../../hooks/useConnections';
import { supabase } from '../../lib/supabase';

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
    const { isLight, accent } = useTheme();
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
    const [selectedEmployeeSubRole, setSelectedEmployeeSubRole] = useState<'PARTNER' | 'SCOUT' | 'ANALYST'>('PARTNER');

    // Real Data State
    const { data: network, loading: isConnectionsLoading } = useConnections({ currentUser });
    const [ownerConnections, setOwnerConnections] = useState<UserType[]>([]);
    const [isOwnerConnectionsLoading, setIsOwnerConnectionsLoading] = useState(false);

    const currentUserMember = project.members.find(m => m.userId === (currentUser.id as unknown as string));
    const currentUserRole = currentUserMember?.role || (project.ownerId === (currentUser.id as unknown as string) ? ProjectRole.OWNER : null);

    // Fetch Owner Connections if needed
    useEffect(() => {
        const fetchOwnerConnections = async () => {
            if (!addMemberType) return;
            if (currentUserRole === ProjectRole.OWNER) return; // Already have them via useConnections

            const perm = project.settings.employeeAddPermission;
            if (currentUserRole === ProjectRole.ADMIN && (perm === EmployeeAddPermission.ALL || perm === EmployeeAddPermission.OWNER_CONNECTIONS)) {
                setIsOwnerConnectionsLoading(true);
                try {
                    const { data, error } = await supabase.rpc('get_project_owner_connections', { p_project_id: project.id });
                    if (error) throw error;

                    if (data) {
                        const mappedUsers: UserType[] = (data as any[]).map((u: any) => ({
                            id: u.id,
                            displayName: u.display_name || u.email.split('@')[0],
                            email: u.email,
                            role: u.role as Role || Role.USER,
                            avatarUrl: u.avatar_url || '',
                            subscriptionPlan: u.subscription_plan as SubscriptionPlan || SubscriptionPlan.FREE,
                            scansBalance: u.scans_balance || 0,
                            purchasedScans: u.purchased_scans || 0,
                            billingType: u.billing_type as BillingType || BillingType.PREPAID,
                            overageCap: 0,
                            emailIntegrations: []
                        }));
                        setOwnerConnections(mappedUsers);
                    }
                } catch (err) {
                    console.error("Failed to fetch owner connections:", err);
                } finally {
                    setIsOwnerConnectionsLoading(false);
                }
            }
        };

        fetchOwnerConnections();
    }, [addMemberType, currentUserRole, project.id, project.settings.employeeAddPermission]);

    // Reset when type changes
    useEffect(() => {
        setSelectedUsersToAdd([]);
        if (addMemberType === 'EMPLOYEE') {
            setSelectedEmployeeSubRole('PARTNER');
        }
    }, [addMemberType]);

    const availableUsers = useMemo(() => {
        const uniqueUsers = new Map<string, UserType>();

        // 1. Add my connections
        const myConns = network?.connections?.map(c => c.otherUser) || [];
        const perm = project.settings.employeeAddPermission;

        if (currentUserRole === ProjectRole.OWNER || (currentUserRole === ProjectRole.ADMIN && (perm === EmployeeAddPermission.ALL || perm === EmployeeAddPermission.OWN_CONNECTIONS))) {
            myConns.forEach(u => uniqueUsers.set(u.id as unknown as string, u));
        }

        // 2. Add owner connections if Admin and allowed
        if (currentUserRole === ProjectRole.ADMIN && (perm === EmployeeAddPermission.ALL || perm === EmployeeAddPermission.OWNER_CONNECTIONS)) {
            ownerConnections.forEach(u => uniqueUsers.set(u.id as unknown as string, u));
        }

        // Filter out users who are already members
        return Array.from(uniqueUsers.values()).filter(u => !project.members.some(m => m.userId === (u.id as unknown as string)));
    }, [network?.connections, ownerConnections, project.members, currentUserRole, project.settings.employeeAddPermission]);

    const toggleUserSelection = (userId: string) => {
        setSelectedUsersToAdd(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleConfirm = () => {
        let role = ProjectRole.EMPLOYEE;
        let perms: string[] = [];

        if (addMemberType === 'ADMIN') {
            role = ProjectRole.ADMIN;
            perms = ['SCAN', 'ANALYZE'];
        } else if (addMemberType === 'VISITOR') {
            role = ProjectRole.EMPLOYEE;
            perms = [];
        } else if (addMemberType === 'EMPLOYEE') {
            role = ProjectRole.EMPLOYEE;
            if (selectedEmployeeSubRole === 'PARTNER') perms = ['SCAN', 'ANALYZE'];
            else if (selectedEmployeeSubRole === 'SCOUT') perms = ['SCAN'];
            else if (selectedEmployeeSubRole === 'ANALYST') perms = ['ANALYZE'];
        }

        // Add each selected user
        selectedUsersToAdd.forEach(userId => {
            addMember({
                userId,
                role,
                permissions: perms,
                quota: project.settings.defaultScanQuota || 'UNLIMITED'
            });
        });

        onClose();
    };

    if (!addMemberType) return null;

    // Styles
    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const borderColor = isLight ? 'border-slate-100' : 'border-white/10';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const sectionBg = isLight ? 'bg-slate-50/80' : 'bg-black/20';
    const isLoading = isConnectionsLoading || isOwnerConnectionsLoading || isActionLoading;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border ${isLight ? 'border-slate-200' : 'border-white/10'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-6 border-b flex justify-between items-center sticky top-0 z-10 shrink-0 ${modalBg} ${borderColor}`}>
                    <div>
                        <h3 className={`text-lg font-bold ${textPrimary}`}>Add {addMemberType === 'ADMIN' ? 'Admin' : addMemberType === 'EMPLOYEE' ? 'Team Member' : 'Visitor'}</h3>
                        <p className={`text-xs ${textSecondary}`}>Select connections to add to this project.</p>
                    </div>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}><X size={20} /></button>
                </div>

                {isLoading && (
                    <div className="absolute inset-x-0 top-[88px] bottom-0 bg-black/10 backdrop-blur-[1px] z-50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                )}

                {addMemberType === 'EMPLOYEE' && (
                    <div className={`px-6 py-6 border-b shrink-0 ${sectionBg} ${borderColor}`}>
                        <label className={`text-[10px] font-bold uppercase tracking-wider block mb-3 ${textSecondary}`}>Select Role</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setSelectedEmployeeSubRole('PARTNER')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center group ${selectedEmployeeSubRole === 'PARTNER'
                                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-500 ring-1 ring-purple-500/50 shadow-sm z-10'
                                    : isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-slate-50' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                                    }`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${selectedEmployeeSubRole === 'PARTNER' ? 'bg-purple-500/20 text-purple-500' : isLight ? 'bg-slate-100 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500' : 'bg-white/5 text-zinc-500 group-hover:text-purple-400'}`}>
                                    <Briefcase size={20} />
                                </div>
                                <span className="text-xs font-bold">Talent Partner</span>
                            </button>

                            <button
                                onClick={() => setSelectedEmployeeSubRole('SCOUT')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center group ${selectedEmployeeSubRole === 'SCOUT'
                                    ? `bg-${accent}-500/10 border-${accent}-500/50 text-${accent}-500 ring-1 ring-${accent}-500/50 shadow-sm z-10`
                                    : isLight ? `bg-white border-slate-200 text-slate-600 hover:border-${accent}-300 hover:bg-slate-50` : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                                    }`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${selectedEmployeeSubRole === 'SCOUT' ? `bg-${accent}-500/20 text-${accent}-500` : isLight ? `bg-slate-100 text-slate-400 group-hover:bg-${accent}-50 group-hover:text-${accent}-500` : `bg-white/5 text-zinc-500 group-hover:text-${accent}-400`}`}>
                                    <Search size={20} />
                                </div>
                                <span className="text-xs font-bold">Talent Scout</span>
                            </button>

                            <button
                                onClick={() => setSelectedEmployeeSubRole('ANALYST')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center group ${selectedEmployeeSubRole === 'ANALYST'
                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 ring-1 ring-blue-500/50 shadow-sm z-10'
                                    : isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                                    }`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${selectedEmployeeSubRole === 'ANALYST' ? 'bg-blue-500/20 text-blue-500' : isLight ? 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500' : 'bg-white/5 text-zinc-500 group-hover:text-blue-400'}`}>
                                    <BarChart2 size={20} />
                                </div>
                                <span className="text-xs font-bold">Talent Analyst</span>
                            </button>
                        </div>

                        <div className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed flex gap-3 animate-fade-in relative overflow-hidden ${isLight ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-blue-500/10 border-blue-500/20 text-zinc-400'}`}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="shrink-0 mt-0.5 text-blue-500">
                                <Info size={16} />
                            </div>
                            <div className="font-medium">
                                {selectedEmployeeSubRole === 'PARTNER' && (
                                    <span>
                                        <strong className="block mb-1 opacity-80 uppercase tracking-wide">Full Access</strong>
                                        Partners have complete control over the project. They can upload resumes, run AI scans, analyze candidates, and view detailed reports.
                                    </span>
                                )}
                                {selectedEmployeeSubRole === 'SCOUT' && (
                                    <span>
                                        <strong className="block mb-1 opacity-80 uppercase tracking-wide">Sourcing Focus</strong>
                                        Scouts can upload resumes and perform initial screenings. They cannot access aggregated analytics or strategic reports.
                                    </span>
                                )}
                                {selectedEmployeeSubRole === 'ANALYST' && (
                                    <span>
                                        <strong className="block mb-1 opacity-80 uppercase tracking-wide">Insights Focus</strong>
                                        Analysts have read-only access to recruitment data and analytics dashboards. They cannot upload files or modify candidate data.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {availableUsers.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                                <UserPlus size={32} className={`opacity-50 ${textSecondary}`} />
                            </div>
                            <p className={`text-sm font-medium ${textSecondary}`}>No eligible connections found.</p>
                            <p className={`text-xs mt-1 opacity-60 ${textSecondary}`}>Connect with more people to add them here.</p>
                        </div>
                    ) : (
                        availableUsers.map(u => {
                            const isSelected = selectedUsersToAdd.includes(u.id as unknown as string);
                            return (
                                <div
                                    key={u.id as unknown as string}
                                    onClick={() => toggleUserSelection(u.id as unknown as string)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? (isLight ? `bg-${accent}-50 border-${accent}-200 shadow-sm` : `bg-${accent}-500/10 border-${accent}-500/30`) : (isLight ? 'hover:bg-slate-50 border-transparent hover:border-slate-100' : 'hover:bg-white/5 border-transparent hover:border-white/5')}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.displayName}`} className={`w-10 h-10 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`} alt="" />
                                        <div className="min-w-0">
                                            <div className={`text-sm font-bold truncate ${isSelected ? `text-${accent}-600` : textPrimary}`}>{u.displayName}</div>
                                            <div className={`text-xs truncate ${textSecondary}`}>{u.email}</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isSelected ? `bg-${accent}-500 border-${accent}-500 text-white` : (isLight ? 'border-slate-300 bg-white' : 'border-zinc-700 bg-transparent')}`}>
                                        {isSelected && <Check size={12} strokeWidth={4} />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className={`p-5 border-t flex justify-end gap-3 shrink-0 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#18181b] border-white/5'}`}>
                    <button onClick={onClose} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedUsersToAdd.length === 0 || isLoading}
                        className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none bg-${accent}-600 hover:bg-${accent}-500 shadow-${accent}-900/20`}
                    >
                        {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        Add {selectedUsersToAdd.length > 0 ? `${selectedUsersToAdd.length} Members` : 'Selected'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
