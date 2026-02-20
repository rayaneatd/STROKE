import { useState, useEffect, useMemo } from 'react';
import { Project, User as UserType, ProjectRole, EmployeeAddPermission, Role, SubscriptionPlan, BillingType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useConnections } from './useConnections';
import { supabase } from '../lib/supabase';
import { getOrgNamesFromEmails } from '../utils/emailDomains';

export interface UseAddMemberModalProps {
    project: Project;
    currentUser: UserType;
    addMemberType: 'ADMIN' | 'EMPLOYEE' | 'VISITOR' | null;
    onClose: () => void;
    addMember: (params: { userId: string, role: ProjectRole, permissions: string[], quota: number | 'UNLIMITED' }) => void;
    isActionLoading: boolean;
}

export const useAddMemberModal = ({
    project,
    currentUser,
    addMemberType,
    onClose,
    addMember,
    isActionLoading
}: UseAddMemberModalProps) => {
    const { isLight, accent } = useTheme();
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
    const [selectedEmployeeSubRole, setSelectedEmployeeSubRole] = useState<'PARTNER' | 'SCOUT' | 'ANALYST'>('PARTNER');
    const [orgFilter, setOrgFilter] = useState<string>('ALL');

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
                            emailIntegrations: [],
                            workMails: Array.isArray(u.work_mails) ? u.work_mails : [],
                            orgNames: getOrgNamesFromEmails(Array.isArray(u.work_mails) ? u.work_mails : [])
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
        let result = Array.from(uniqueUsers.values()).filter(u => !project.members.some(m => m.userId === (u.id as unknown as string)));
        if (orgFilter !== 'ALL') {
            result = result.filter((u) => (u.orgNames || []).includes(orgFilter));
        }
        return result;
    }, [network?.connections, ownerConnections, project.members, currentUserRole, project.settings.employeeAddPermission, orgFilter]);

    const orgOptions = useMemo(() => {
        const set = new Set<string>();
        availableUsers.forEach((u) => {
            (u.orgNames || []).forEach((org) => set.add(org));
        });
        return Array.from(set.values());
    }, [availableUsers]);

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
            let quota: number | 'UNLIMITED' = project.settings.defaultScanQuota || 'UNLIMITED';

            // Apply Role-Based Quotas if defined
            if (role === ProjectRole.ADMIN && project.settings.adminScanQuota) {
                quota = project.settings.adminScanQuota;
            } else if (role === ProjectRole.EMPLOYEE) {
                if (selectedEmployeeSubRole === 'PARTNER' && project.settings.partnerScanQuota) {
                    quota = project.settings.partnerScanQuota;
                } else if (selectedEmployeeSubRole === 'SCOUT' && project.settings.scoutScanQuota) {
                    quota = project.settings.scoutScanQuota;
                } else if (selectedEmployeeSubRole === 'ANALYST') {
                    quota = 0;
                }
            }

            addMember({
                userId,
                role,
                permissions: perms,
                quota
            });
        });

        onClose();
    };

    const isLoading = isConnectionsLoading || isOwnerConnectionsLoading || isActionLoading;

    return {
        selectedUsersToAdd,
        setSelectedUsersToAdd,
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
    };
};
