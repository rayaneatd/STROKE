
import React, { useState, useEffect } from 'react';
import { UserPlus, X, Briefcase, Search, BarChart2, Check, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project, User as UserType, ProjectRole, EmployeeAddPermission, ProjectPermission, UserId, Role, SubscriptionPlan, BillingType } from '../../types';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';

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
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
    const [selectedEmployeeSubRole, setSelectedEmployeeSubRole] = useState<'PARTNER' | 'SCOUT' | 'ANALYST'>('PARTNER');

    // Reset when type changes
    useEffect(() => {
        setSelectedUsersToAdd([]);
        if (addMemberType === 'EMPLOYEE') {
            setSelectedEmployeeSubRole('PARTNER');
        }
    }, [addMemberType]);

    // Fetch Current User's Connections
    const { data: myConnections = [] } = useQuery({
        queryKey: ['connections', currentUser.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('connections')
                .select(`
                *,
                sender:profiles!connections_sender_id_fkey(*),
                receiver:profiles!connections_receiver_id_fkey(*)
            `)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .eq('status', 'CONNECTED');
            if (error) throw error;
            return data.map((item: any) => {
                const other = item.sender_id === currentUser.id ? item.receiver : item.sender;
                return {
                    id: other.id,
                    displayName: other.display_name || other.email.split('@')[0],
                    email: other.email,
                    avatarUrl: other.avatar_url,
                    role: other.role as Role || Role.USER
                };
            });
        },
        enabled: !!addMemberType
    });

    // Fetch Owner's Connections if needed
    const { data: ownerConnections = [] } = useQuery({
        queryKey: ['connections', project.ownerId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('connections')
                .select(`
                *,
                sender:profiles!connections_sender_id_fkey(*),
                receiver:profiles!connections_receiver_id_fkey(*)
            `)
                .or(`sender_id.eq.${project.ownerId},receiver_id.eq.${project.ownerId}`)
                .eq('status', 'CONNECTED');
            if (error) throw error;
            return data.map((item: any) => {
                const other = item.sender_id === project.ownerId ? item.receiver : item.sender;
                return {
                    id: other.id,
                    displayName: other.display_name || other.email.split('@')[0],
                    email: other.email,
                    avatarUrl: other.avatar_url,
                    role: other.role as Role || Role.USER
                };
            });
        },
        enabled: !!addMemberType && project.ownerId !== currentUser.id && project.settings.employeeAddPermission !== EmployeeAddPermission.OWN_CONNECTIONS
    });

    const getAvailableConnectionsToAdd = () => {
        const currentUserRole = project.members.find(m => m.userId === currentUser.id)?.role;

        if (currentUserRole === ProjectRole.OWNER) {
            return myConnections;
        }

        if (currentUserRole === ProjectRole.ADMIN) {
            const perm = project.settings.employeeAddPermission;

            if (perm === EmployeeAddPermission.OWN_CONNECTIONS) {
                return myConnections;
            }

            if (perm === EmployeeAddPermission.OWNER_CONNECTIONS) {
                return ownerConnections;
            }

            const uniqueUsers = new Map<string, any>();
            myConnections.forEach(u => uniqueUsers.set(u.id, u));
            ownerConnections.forEach(u => uniqueUsers.set(u.id, u));
            return Array.from(uniqueUsers.values());
        }
        return [];
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsersToAdd(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleBulkAdd = (role: ProjectRole, permissions: ProjectPermission[]) => {
        if (selectedUsersToAdd.length === 0) return;

        selectedUsersToAdd.forEach(userId => {
            addMember({
                userId,
                role,
                permissions,
                quota: project.settings.defaultScanQuota
            });
        });

        onClose();
    };

    const handleConfirm = () => {
        let role = ProjectRole.EMPLOYEE;
        let perms: ProjectPermission[] = [];

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
        handleBulkAdd(role, perms);
    };

    if (!addMemberType) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{t(`modal.addMember.title.${addMemberType}`)}</h3>
                        <p className="text-xs text-slate-500">{t('modal.addMember.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {addMemberType === 'EMPLOYEE' && (
                    <div className="px-6 py-6 bg-slate-50/50 border-b border-slate-100 shrink-0">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">{t('modal.addMember.selectRole')}</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setSelectedEmployeeSubRole('PARTNER')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center group ${selectedEmployeeSubRole === 'PARTNER'
                                        ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500 shadow-sm z-10'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${selectedEmployeeSubRole === 'PARTNER' ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-brand-500'}`}>
                                    <Briefcase size={20} />
                                </div>
                                <span className="text-xs font-bold">{t('modal.addMember.roles.partner.title')}</span>
                            </button>

                            <button
                                onClick={() => setSelectedEmployeeSubRole('SCOUT')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center group ${selectedEmployeeSubRole === 'SCOUT'
                                        ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500 shadow-sm z-10'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${selectedEmployeeSubRole === 'SCOUT' ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-brand-500'}`}>
                                    <Search size={20} />
                                </div>
                                <span className="text-xs font-bold">{t('modal.addMember.roles.scout.title')}</span>
                            </button>

                            <button
                                onClick={() => setSelectedEmployeeSubRole('ANALYST')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center group ${selectedEmployeeSubRole === 'ANALYST'
                                        ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500 shadow-sm z-10'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${selectedEmployeeSubRole === 'ANALYST' ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-brand-500'}`}>
                                    <BarChart2 size={20} />
                                </div>
                                <span className="text-xs font-bold">{t('modal.addMember.roles.analyst.title')}</span>
                            </button>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-slate-600 text-xs leading-relaxed flex gap-3 animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                            <div className="shrink-0 mt-0.5 text-blue-500">
                                <Info size={16} />
                            </div>
                            <div className="font-medium">
                                {selectedEmployeeSubRole === 'PARTNER' && (
                                    <span>
                                        <strong className="text-blue-700 block mb-1">{t('modal.addMember.roles.partner.descTitle')}</strong>
                                        {t('modal.addMember.roles.partner.desc')}
                                    </span>
                                )}
                                {selectedEmployeeSubRole === 'SCOUT' && (
                                    <span>
                                        <strong className="text-blue-700 block mb-1">{t('modal.addMember.roles.scout.descTitle')}</strong>
                                        {t('modal.addMember.roles.scout.desc')}
                                    </span>
                                )}
                                {selectedEmployeeSubRole === 'ANALYST' && (
                                    <span>
                                        <strong className="text-blue-700 block mb-1">{t('modal.addMember.roles.analyst.descTitle')}</strong>
                                        {t('modal.addMember.roles.analyst.desc')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {getAvailableConnectionsToAdd().filter(u => !project.members.some(m => m.userId === u.id)).length === 0 ? (
                        <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                <UserPlus size={32} className="opacity-50 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium">{t('modal.addMember.emptyState.title')}</p>
                            <p className="text-xs mt-1">{t('modal.addMember.emptyState.desc')}</p>
                        </div>
                    ) : (
                        getAvailableConnectionsToAdd().filter(u => !project.members.some(m => m.userId === u.id)).map(u => {
                            const isSelected = selectedUsersToAdd.includes(u.id);
                            return (
                                <div
                                    key={u.id}
                                    onClick={() => toggleUserSelection(u.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-brand-50 border-brand-200 shadow-sm' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-100" alt="" />
                                        <div>
                                            <div className={`text-sm font-bold ${isSelected ? 'text-brand-700' : 'text-slate-900'}`}>{u.displayName}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 bg-white'}`}>
                                        {isSelected && <Check size={12} strokeWidth={4} />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">{t('common.cancel')}</button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedUsersToAdd.length === 0}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        {t('modal.addMember.actions.addSelected', { count: selectedUsersToAdd.length })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
