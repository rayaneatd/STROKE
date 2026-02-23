import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, ProjectRole, User as UserType, ProjectFile, OutreachStrategy, FileId, EmployeeAddPermission } from '../types';
import { supabase } from '../lib/supabase';
import { useFileProcessing } from './useFileProcessing';
import { useProjectAnalytics } from './useProjectAnalytics';
import { useAuth } from '../context/AuthContext';

interface UseProjectDetailProps {
    projectId: string;
    onBack: () => void;
    currentUser: UserType;
    onNavigate: (page: string) => void;
    onUpdateUser?: (data: Partial<UserType>, sync?: boolean) => void;
}

export const useProjectDetail = ({ projectId, onBack, currentUser, onNavigate, onUpdateUser }: UseProjectDetailProps) => {
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();

    // UI Local States
    const [isIdentitySelectorOpen, setIsIdentitySelectorOpen] = useState(false);
    const [addMemberType, setAddMemberType] = useState<'ADMIN' | 'EMPLOYEE' | 'VISITOR' | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isNoScansModalOpen, setIsNoScansModalOpen] = useState(false);
    const [isQuotaExceededModalOpen, setIsQuotaExceededModalOpen] = useState(false);
    const [isOwnerBannedModalOpen, setIsOwnerBannedModalOpen] = useState(false);
    const [isProjectLockedModalOpen, setIsProjectLockedModalOpen] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [quotaError, setQuotaError] = useState<string | null>(null);

    // 1. Fetch Project Details
    const { data: project, isLoading: isProjectLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_user_project' as any, { 
                    target_user_id: currentUser.id, 
                    target_project_id: projectId 
                })
                .single();

            if (error) throw error;
            if (!data) throw new Error('Project not found');

            const projectData = data as any;
            return {
                id: projectData.id,
                title: projectData.title || 'Untitled',
                description: projectData.description || '',
                ownerId: projectData.owner_id,
                createdAt: projectData.created_at,
                status: projectData.status,
                settings: projectData.settings || {},
                investmentBalance: projectData.investment_balance || 0,
                totalInvested: projectData.total_invested || 0,
                members: Array.isArray(projectData.members) ? projectData.members.map((m: any) => ({
                    userId: m.userId ?? m.user_id,
                    role: m.role as ProjectRole,
                    permissions: m.permissions || [],
                    scansUsed: m.scansUsed ?? m.scans_used ?? 0,
                    scanQuota: ((m.scanQuota ?? m.scan_quota) === 'UNLIMITED' || String(m.scanQuota ?? m.scan_quota) === '-1') ? 'UNLIMITED' : Number(m.scanQuota ?? m.scan_quota),
                    joinedAt: m.joinedAt ?? m.joined_at,
                    user: m.user ? {
                        id: m.user.id,
                        email: m.user.email,
                        displayName: m.user.displayName || m.user.display_name || m.user.email?.split('@')[0] || '',
                        avatarUrl: m.user.avatarUrl || m.user.avatar_url,
                        scansBalance: m.user.scansBalance ?? m.user.scans_balance ?? 0,
                        isBanned: m.user.role === 'BANNED'
                    } : undefined
                })) : []
            } as Project;
        }
    });

    // 2. Project Analytics & Stats
    const { data: analyticsData } = useProjectAnalytics(projectId);

    const analytics = useMemo(() => ({
        total: analyticsData?.total || 0,
        completed: analyticsData?.completed || 0,
        pending: analyticsData?.pending || 0,
        riskCount: analyticsData?.riskCount || 0,
        avgScore: analyticsData?.avgScore || 0,
        timelineData: analyticsData?.timelineData || []
    }), [analyticsData]);

    const topCandidates = analyticsData?.topCandidates || [];
    const contributionData = analyticsData?.contributionData || [];

    // Real-time Subscriptions
    useEffect(() => {
        const channel = supabase
            .channel(`project_detail_${projectId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates', filter: `project_id=eq.${projectId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics_events', filter: `project_id=eq.${projectId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${projectId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, queryClient]);

    // File Processing Integration
    const {
        files,
        setFiles,
        isUploading,
        addFiles,
        removeFile,
        retryFile,
        queueFilesForProcessing,
        uploadPendingFiles
    } = useFileProcessing(projectId, currentUser, project, () => { });

    // Sync files state with candidates from DB
    // REMOVED: setFiles(candidates) - We now rely on useCandidates and useProjectAnalytics
    // for efficient data handling. files state in useFileProcessing only tracks local/failed uploads.


    // Permissions & Derived State
    const currentMemberRecord = useMemo(() => project?.members.find(m => m.userId === currentUser.id), [project, currentUser.id]);
    const currentUserRole = currentMemberRecord?.role;
    const currentPermissions = currentMemberRecord?.permissions || [];

    const isProjectOwner = currentUser.id === project?.ownerId;
    const isAdmin = currentUserRole === ProjectRole.ADMIN;

    // Actions & Derived Permissions (Moved up for Tab Management)
    const isActive = project?.status === 'ACTIVE';
    const isArchived = project?.status === 'ARCHIVED';
    const isCompleted = project?.status === 'COMPLETED';

    const canManageTeam = !isCompleted && (isActive || (isArchived && (isProjectOwner || isAdmin)));
    
    // Check if user can actually invite based on invitation policy
    const canInviteMembers = useMemo(() => {
        if (!project || !currentMemberRecord) return false;
        
        const perm = project.settings.employeeAddPermission;
        
        if (currentMemberRecord.role === ProjectRole.OWNER) {
            return true; // Owner can always invite
        }
        
        if (currentMemberRecord.role === ProjectRole.ADMIN) {
            return perm === EmployeeAddPermission.ALL || perm === EmployeeAddPermission.OWN_CONNECTIONS || perm === EmployeeAddPermission.OWNER_CONNECTIONS;
        }
        
        return false;
    }, [project, currentMemberRecord]);
    
    const canChat = !isCompleted && (isActive || (isArchived && (isProjectOwner || isAdmin)));
    const canScan = isActive;
    const canEditProject = isProjectOwner || isAdmin;

    const canViewOverview = isProjectOwner || isAdmin || currentPermissions.includes('ANALYZE');
    const canViewResumes = isProjectOwner || isAdmin || currentPermissions.includes('SCAN');
    const canAccessAdminChannel = isProjectOwner || isAdmin;

    const isAnalyst = !isAdmin && !isProjectOwner && currentPermissions.includes('ANALYZE') && !currentPermissions.includes('SCAN');
    const isScout = !isAdmin && !isProjectOwner && currentPermissions.includes('SCAN') && !currentPermissions.includes('ANALYZE');

    const canViewActivityTab = isProjectOwner || isAdmin || (isAnalyst && project?.settings.analystCanViewActivity);

    const canUseAntiGhosting = isProjectOwner || isAdmin ||
        (isAnalyst && project?.settings.analystCanUseGhosting) ||
        (isScout && project?.settings.scoutCanUseGhosting);

    // Tab Management with URL Persistence
    const [searchParams, setSearchParams] = useSearchParams();
    
    const activeTab = useMemo(() => {
        const tab = searchParams.get('tab');
        
        // Optimistic handling: if project is loading, preserve the tab from URL if it's a known valid tab
        // This prevents the tab from flickering to 'overview' during initial load
        if (!project) {
            if (tab && ['overview', 'resumes', 'team', 'discussions', 'activity'].includes(tab)) {
                return tab;
            }
            return 'overview';
        }

        // Validate tab existence and permissions
        if (tab === 'overview' && canViewOverview) return 'overview';
        if (tab === 'resumes' && canViewResumes) return 'resumes';
        if (tab === 'team') return 'team';
        if (tab === 'discussions' && canChat) return 'discussions';
        if (tab === 'activity' && canViewActivityTab) return 'activity';
        
        // Fallback logic
        const me = currentMemberRecord;
        if (!me) return 'overview';
        if (me.role === ProjectRole.OWNER || me.role === ProjectRole.ADMIN) return 'overview';
        if (me.permissions.includes('ANALYZE')) return 'overview';
        if (me.permissions.includes('SCAN')) return 'resumes';
        return 'team';
    }, [searchParams, project, currentMemberRecord, canViewOverview, canViewResumes, canChat, canViewActivityTab]);

    const setActiveTab = (tab: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', tab);
            return newParams;
        }, { replace: true });
    };

    // Mutations
    const updateProjectMutation = useMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase.rpc('update_project' as any, {
                p_project_id: projectId,
                p_title: data.title,
                p_description: data.description,
                p_status: data.status,
                p_settings: data.settings
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            setIsEditModalOpen(false);
        }
    });

    const markViewedMutation = useMutation({
        mutationFn: async (candidateId: string) => {
            const { error } = await supabase.rpc('mark_candidate_viewed' as any, {
                candidate_id: candidateId,
                user_id: currentUser.id
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates', projectId] });
        }
    });

    const markExportedMutation = useMutation({
        mutationFn: async (candidateId: string) => {
            const { error } = await supabase.rpc('mark_candidate_exported', {
                candidate_id: candidateId,
                user_id: currentUser.id
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates', projectId] });
        }
    });

    const updateCandidateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            // Transform keys for Supabase
            const payload = { ...data };
            if (payload.candidateName !== undefined) {
                payload.candidate_name = payload.candidateName;
                delete payload.candidateName;
            }
            if (payload.emailSentAt !== undefined) {
                payload.email_sent_at = payload.emailSentAt;
                delete payload.emailSentAt;
            }
            if (payload.emailDraft !== undefined) {
                payload.email_draft = payload.emailDraft;
                delete payload.emailDraft;
            }

            const { error } = await supabase.from('candidates').update(payload).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates', projectId] });
        }
    });

    const addMemberMutation = useMutation({
        mutationFn: async ({ userId, role, permissions, quota }: { userId: string, role: ProjectRole, permissions: string[], quota: number | 'UNLIMITED' }) => {
            const { error } = await supabase.from('project_members').insert({
                project_id: projectId,
                user_id: userId,
                role,
                permissions,
                scan_quota: String(quota === 'UNLIMITED' ? -1 : quota),
                joined_at: new Date().toISOString()
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }
    });

    const updateMemberMutation = useMutation({
        mutationFn: async ({ userId, data }: { userId: string, data: any }) => {
            // Transform quota if present
            const payload = { ...data };
            if ('scanQuota' in data) {
                payload.scan_quota = String(data.scanQuota === 'UNLIMITED' ? -1 : data.scanQuota);
                delete payload.scanQuota;
            }
            const { error } = await supabase.from('project_members').update(payload).eq('project_id', projectId).eq('user_id', userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }
    });

    const fundProjectMutation = useMutation({
        mutationFn: async (amount: number) => {
            const { data, error } = await supabase.rpc('transfer_project_funds', {
                p_project_id: projectId,
                p_amount: amount,
                p_action: 'DEPOSIT'
            });
            if (error) throw error;
            const result = data as { success: boolean; error?: string; user_balance: number };
            if (result && !result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            if (onUpdateUser && data) {
                onUpdateUser({ scansBalance: data.user_balance }, true);
            }
        }
    });

    const withdrawFundsMutation = useMutation({
        mutationFn: async (amount: number) => {
            const { data, error } = await supabase.rpc('transfer_project_funds' as any, {
                p_project_id: projectId,
                p_amount: amount,
                p_action: 'WITHDRAW'
            });
            if (error) throw error;
            const result = data as { success: boolean; error?: string; user_balance: number };
            if (result && !result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            if (onUpdateUser && data) {
                onUpdateUser({ scansBalance: data.user_balance }, true);
            }
        }
    });

    // Analytics Calculation - REMOVED DUPLICATE
    // We already have 'analytics', 'topCandidates', and 'contributionData' defined above using useProjectAnalytics hook.
    // The previous implementation here was redundant and used incomplete 'files' state (local only).

    // Actions & Derived Permissions (Moved up for Tab Management)

    const handleEditClick = () => {
        if (canEditProject) setIsEditModalOpen(true);
    };

    const handleExport = () => {
        // Logic for export - usually a direct CSV generation or call to an edge function
        console.log("Exporting project data...");
    };

    const handleMarkContacted = (fileId: string) => {
        updateCandidateMutation.mutate({
            id: fileId,
            data: {
                emailSentAt: new Date().toISOString(),
                // could add email_sent_by: currentUser.id if column exists
            }
        });
    };

    const handleBatchUpdate = async (updates: { id: string, changes: Partial<ProjectFile> }[]) => {
        try {
            for (const update of updates) {
                await updateCandidateMutation.mutateAsync({ id: update.id, data: update.changes });
            }
        } catch (error) {
            console.error("Batch update failed:", error);
        }
    };

    const saveProjectChanges = (e: React.FormEvent, updatedProject: Partial<Project>) => {
        e.preventDefault();
        updateProjectMutation.mutate({
            title: updatedProject.title,
            description: updatedProject.description,
            status: updatedProject.status,
            settings: updatedProject.settings,
            investment_balance: updatedProject.investmentBalance
        });
    };

    const handleStartScan = async () => {
        if (!project || !canScan) {
            setIsProjectLockedModalOpen(true);
            return;
        }

        const isInvestmentMode = project.settings.billingMode === 'PROJECT_INVESTMENT';
        const owner = project.members.find(m => m.role === ProjectRole.OWNER);
        const displayBalance = isInvestmentMode ? project.investmentBalance : (owner?.user?.scansBalance || 0);

        const pendingFiles = files.filter(f => f.status === 'PENDING');
        if (pendingFiles.length === 0) return;

        const cost = pendingFiles.length;

        // Check Member Quota FIRST
        if (currentMemberRecord?.scanQuota !== 'UNLIMITED' && 
            (currentMemberRecord?.scansUsed || 0) + cost > (currentMemberRecord?.scanQuota || 0)) {
            setIsQuotaExceededModalOpen(true);
            return;
        }

        if (displayBalance < cost) {
            if (isProjectOwner) {
                if (isInvestmentMode) {
                    setIsEditModalOpen(true);
                } else {
                    setIsUpgradeModalOpen(true);
                }
            } else {
                setIsNoScansModalOpen(true);
            }
            return;
        }

        try {
            // Upload files first
            // Note: Credit deduction is now handled progressively inside uploadPendingFiles
            await uploadPendingFiles();

            // Delegate real processing to useFileProcessing or an edge function
            queueFilesForProcessing(pendingFiles);
            
            // Refresh Data
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['profile'] }); // Update user balance if OWNER_WALLET
            if (refreshUser) refreshUser();
        } catch (err) {
            console.error('Scan deduction error:', err);
            setQuotaError('An error occurred while processing scan credits.');
        }
    };

    const handleFilesAdded = (addedFiles: File[]) => {
        if (!canScan) {
            setIsProjectLockedModalOpen(true);
            return;
        }
        addFiles(addedFiles);
    };

    const handleIdentityChange = (emailId: string) => {
        // In a real app, update project_members table
        // preferred_outreach_email_id column is not yet in the schema
        // supabase.from('project_members')
        //     .update({ preferred_outreach_email_id: emailId } as any)
        //     .eq('project_id', projectId)
        //     .eq('user_id', currentUser.id)
        //     .then(() => {
        //         queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        //         setIsIdentitySelectorOpen(false);
        //     });

        // Temporary implementation
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        setIsIdentitySelectorOpen(false);
    };

    // Derived UI State
    const isCentralized = project?.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY;
    const showIdentitySelector = canUseAntiGhosting && !isCentralized;
    const showCentralizedBadge = canUseAntiGhosting && isCentralized;
    const activeEmail = currentUser.emailIntegrations.find(e => e.id === currentMemberRecord?.preferredOutreachEmailId);
    const currentIdentityId = currentMemberRecord?.preferredOutreachEmailId;

    return {
        project,
        activeTab,
        setActiveTab,
        files, // Now contains only local failures/uploads
        isUploading,
        isProjectLoading, // Removed isCandidatesLoading
        analytics,
        topCandidates,
        contributionData,
        currentUserRole,
        currentPermissions,
        isProjectOwner,
        isAdmin,
        isAnalyst,
        isScout,
        isActive,
        isArchived,
        isCompleted,
        canManageTeam,
        canInviteMembers,
        canChat,
        canScan,
        canEditProject,
        canViewOverview,
        canViewResumes,
        canAccessAdminChannel,
        canViewActivityTab,
        canUseAntiGhosting,
        isIdentitySelectorOpen,
        setIsIdentitySelectorOpen,
        addMemberType,
        setAddMemberType,
        isEditModalOpen,
        setIsEditModalOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isNoScansModalOpen,
        setIsNoScansModalOpen,
        isQuotaExceededModalOpen,
        setIsQuotaExceededModalOpen,
        isOwnerBannedModalOpen,
        setIsOwnerBannedModalOpen,
        isProjectLockedModalOpen,
        setIsProjectLockedModalOpen,
        isDescriptionExpanded,
        setIsDescriptionExpanded,
        quotaError,
        setQuotaError,
        handleEditClick,
        handleExport,
        handleMarkContacted,
        handleBatchUpdate,
        saveProjectChanges,
        handleStartScan,
        handleFilesAdded,
        handleIdentityChange,
        showCentralizedBadge,
        showIdentitySelector,
        activeEmail,
        currentIdentityId,
        onBack,
        setProject: (p: any) => {
            // This is a bridge for legacy code that expected a setState
            queryClient.setQueryData(['project', projectId], p);
        },
        removeFile,
        retryFile,
        markViewed: markViewedMutation.mutate,
        markExported: markExportedMutation.mutate,
        projectOwner: project?.members.find(m => m.role === ProjectRole.OWNER)?.user,
        ownerScans: project?.members.find(m => m.role === ProjectRole.OWNER)?.user?.scansBalance || 0,
        currentMemberQuota: currentMemberRecord?.scanQuota,
        currentMemberUsed: currentMemberRecord?.scansUsed,
        isInvestmentMode: project?.settings.billingMode === 'PROJECT_INVESTMENT',
        displayBalance: project?.settings.billingMode === 'PROJECT_INVESTMENT'
            ? project.investmentBalance
            : (project?.members.find(m => m.role === ProjectRole.OWNER)?.user?.scansBalance || 0),
        centralizedEmailAddress: project?.members.find(m => m.role === ProjectRole.OWNER)?.user?.email,
        addMember: addMemberMutation.mutate,
        removeMember: removeMemberMutation.mutate,
        updateMember: updateMemberMutation.mutate,
        fundProject: fundProjectMutation.mutateAsync,
        withdrawFunds: withdrawFundsMutation.mutateAsync,
        updateProject: updateProjectMutation.mutate,
        isActionLoading: addMemberMutation.isPending || removeMemberMutation.isPending || updateMemberMutation.isPending || fundProjectMutation.isPending || withdrawFundsMutation.isPending || markViewedMutation.isPending || markExportedMutation.isPending
    };
};
