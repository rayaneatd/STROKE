import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, ProjectRole, User as UserType, ProjectFile, OutreachStrategy, FileId } from '../types';
import { supabase } from '../lib/supabase';
import { useFileProcessing } from './useFileProcessing';

interface UseProjectDetailProps {
    projectId: string;
    onBack: () => void;
    currentUser: UserType;
    onNavigate: (page: string) => void;
    onUpdateUser?: (data: Partial<UserType>, sync?: boolean) => void;
}

export const useProjectDetail = ({ projectId, onBack, currentUser, onNavigate, onUpdateUser }: UseProjectDetailProps) => {
    const queryClient = useQueryClient();

    // UI Local States
    const [isIdentitySelectorOpen, setIsIdentitySelectorOpen] = useState(false);
    const [addMemberType, setAddMemberType] = useState<'ADMIN' | 'EMPLOYEE' | 'VISITOR' | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isNoScansModalOpen, setIsNoScansModalOpen] = useState(false);
    const [isOwnerBannedModalOpen, setIsOwnerBannedModalOpen] = useState(false);
    const [isProjectLockedModalOpen, setIsProjectLockedModalOpen] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [quotaError, setQuotaError] = useState<string | null>(null);

    // 1. Fetch Project Details
    const { data: project, isLoading: isProjectLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_user_project', { 
                    target_user_id: currentUser.id, 
                    target_project_id: projectId 
                })
                .single();

            if (error) throw error;

            const projectData = data as any;
            return {
                id: projectData.id,
                title: projectData.title,
                description: projectData.description || '',
                ownerId: projectData.owner_id,
                createdAt: projectData.created_at,
                status: projectData.status,
                settings: projectData.settings || {},
                investmentBalance: projectData.investment_balance || 0,
                totalInvested: projectData.total_invested || 0,
                members: Array.isArray(projectData.members) ? projectData.members.map((m: any) => ({
                    userId: m.userId,
                    role: m.role as ProjectRole,
                    permissions: m.permissions || [],
                    scansUsed: m.scansUsed || 0,
                    scanQuota: m.scanQuota === 'UNLIMITED' ? 'UNLIMITED' : Number(m.scanQuota),
                    joinedAt: m.joinedAt,
                    user: m.user ? {
                        id: m.user.id,
                        email: m.user.email,
                        displayName: m.user.displayName || m.user.email?.split('@')[0] || 'Unknown',
                        avatarUrl: m.user.avatarUrl,
                        isBanned: m.user.role === 'BANNED'
                    } : undefined
                })) : []
            } as Project;
        }
    });

    // 2. Fetch Candidates (ProjectFiles)
    const { data: candidates = [], isLoading: isCandidatesLoading } = useQuery({
        queryKey: ['candidates', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .eq('project_id', projectId)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;

            return data.map((c: any) => ({
                id: c.id as FileId,
                projectId: c.project_id,
                name: c.name,
                size: c.size,
                status: c.status,
                uploadedAt: c.uploaded_at,
                score: c.score,
                candidateName: c.candidate_name,
                uploadedByUserId: c.uploaded_by,
                viewedBy: c.viewed_by || [],
                exportedBy: c.exported_by || [],
                emailSentAt: c.email_sent_at,
                emailDraft: c.email_draft
            } as ProjectFile));
        }
    });

    // Real-time Subscriptions
    useEffect(() => {
        const channel = supabase
            .channel(`project_detail_${projectId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates', filter: `project_id=eq.${projectId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['candidates', projectId] });
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
        queueFilesForProcessing
    } = useFileProcessing(projectId, currentUser, project, () => { });

    // Sync files state with candidates from DB
    useEffect(() => {
        if (candidates.length > 0) {
            setFiles(candidates);
        }
    }, [candidates, setFiles]);

    // Permissions & Derived State
    const currentMemberRecord = useMemo(() => project?.members.find(m => m.userId === currentUser.id), [project, currentUser.id]);
    const currentUserRole = currentMemberRecord?.role;
    const currentPermissions = currentMemberRecord?.permissions || [];

    const isProjectOwner = currentUser.id === project?.ownerId;
    const isAdmin = currentUserRole === ProjectRole.ADMIN;

    // Tab Management
    const initialTab = useMemo(() => {
        if (!project) return 'overview';
        const me = currentMemberRecord;
        if (!me) return 'overview';
        if (me.role === ProjectRole.OWNER || me.role === ProjectRole.ADMIN) return 'overview';
        if (me.permissions.includes('ANALYZE')) return 'overview';
        if (me.permissions.includes('SCAN')) return 'resumes';
        return 'team';
    }, [project, currentMemberRecord]);

    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'resumes' | 'discussions' | 'activity'>(initialTab);

    // Mutations
    const updateProjectMutation = useMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase.from('projects').update(data).eq('id', projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            setIsEditModalOpen(false);
        }
    });

    const markViewedMutation = useMutation({
        mutationFn: async (candidateId: string) => {
            const { error } = await supabase.rpc('mark_candidate_viewed', {
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
            const { data, error } = await supabase.rpc('transfer_project_funds', {
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

    // Analytics Calculation
    const analytics = useMemo(() => {
        if (!files.length) return { total: 0, completed: 0, pending: 0, avgScore: 0, timelineData: [] };

        const completed = files.filter(f => f.status === 'COMPLETED');
        const pending = files.filter(f => f.status === 'PROCESSING' || f.status === 'PENDING');
        const avgScore = completed.length
            ? Math.round(completed.reduce((acc, f) => acc + (f.score || 0), 0) / completed.length)
            : 0;

        // Calculate timeline data (group by date)
        const timelineMap = new Map<string, number>();
        files.forEach(f => {
            const date = new Date(f.uploadedAt).toLocaleDateString();
            timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
        });

        const timelineData = Array.from(timelineMap.entries())
            .map(([date, applications]) => ({ date, applications }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7); // Last 7 days with data

        return {
            total: files.length,
            completed: completed.length,
            pending: pending.length,
            avgScore,
            timelineData
        };
    }, [files]);

    const topCandidates = useMemo(() => [...files]
        .filter(f => f.score && f.score > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5), [files]);

    const contributionData = useMemo(() => project?.members.map(m => ({
        scans: m.scansUsed,
        role: m.role
    })) || [], [project?.members]);

    // Actions & Derived Permissions
    const isActive = project?.status === 'ACTIVE';
    const isArchived = project?.status === 'ARCHIVED';
    const isCompleted = project?.status === 'COMPLETED';

    const canManageTeam = !isCompleted && (isActive || (isArchived && (isProjectOwner || isAdmin)));
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

        if (displayBalance < pendingFiles.length) {
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

        // Delegate real processing to useFileProcessing or an edge function
        queueFilesForProcessing(pendingFiles);
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
        files,
        isUploading,
        isProjectLoading: isProjectLoading || isCandidatesLoading,
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
        isInvestmentMode: project?.settings.billingMode === 'PROJECT_INVESTMENT',
        displayBalance: project?.settings.billingMode === 'PROJECT_INVESTMENT'
            ? project.investmentBalance
            : (project?.members.find(m => m.role === ProjectRole.OWNER)?.user?.scansBalance || 0),
        centralizedEmailAddress: project?.members.find(m => m.role === ProjectRole.OWNER)?.user?.email,
        addMember: addMemberMutation.mutate,
        removeMember: removeMemberMutation.mutate,
        updateMember: updateMemberMutation.mutate,
        fundProject: fundProjectMutation.mutate,
        withdrawFunds: withdrawFundsMutation.mutate,
        updateProject: updateProjectMutation.mutate,
        isActionLoading: addMemberMutation.isPending || removeMemberMutation.isPending || updateMemberMutation.isPending || fundProjectMutation.isPending || withdrawFundsMutation.isPending || markViewedMutation.isPending || markExportedMutation.isPending
    };
};
