import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, User, ProjectRole, ProjectId } from '../types';
import { supabase } from '../lib/supabase';

const PROJECTS_PER_PAGE = 12;

interface UseProjectsProps {
    currentUser: User;
    onUpdateUser?: (data: Partial<User>, sync?: boolean) => void;
    onNavigate: (page: string) => void;
}

export const useProjects = ({ currentUser, onUpdateUser, onNavigate }: UseProjectsProps) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [displayCount, setDisplayCount] = useState(PROJECTS_PER_PAGE);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'>('ALL');
    const [dateFilter, setDateFilter] = useState<'ALL' | 'LAST_7' | 'LAST_30' | 'LAST_90'>('ALL');
    const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'ME'>('ALL');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

    const [projectToLeave, setProjectToLeave] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    // Fetch Projects via Supabase
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects', currentUser.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    members:project_members(
                        *,
                        user:profiles(*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.description || '',
                ownerId: p.owner_id,
                createdAt: p.created_at,
                status: p.status,
                settings: p.settings || {},
                investmentBalance: p.investment_balance || 0,
                totalInvested: p.total_invested || 0,
                fileCount: 0, // Injected by a separate count or view if needed
                memberCount: p.members?.length || 0,
                members: p.members.map((m: any) => ({
                    userId: m.user_id,
                    role: m.role as ProjectRole,
                    permissions: m.permissions || [],
                    scansUsed: m.scans_used || 0,
                    scanQuota: m.scan_quota === 'UNLIMITED' ? 'UNLIMITED' : Number(m.scan_quota),
                    joinedAt: m.joined_at,
                    user: m.user ? {
                        id: m.user.id,
                        email: m.user.email,
                        displayName: m.user.display_name || m.user.email.split('@')[0],
                        avatarUrl: m.user.avatar_url
                    } : undefined
                }))
            } as Project));
        },
        enabled: !!currentUser.id
    });

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('projects_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, () => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    // Search Debounce
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Handle Clicks Outside Menus
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Reset display count on filter change
    useEffect(() => {
        setDisplayCount(PROJECTS_PER_PAGE);
    }, [debouncedSearchTerm, statusFilter, dateFilter, ownerFilter]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (newProj: any) => {
            const { data, error } = await supabase
                .from('projects')
                .insert(newProj)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsProjectModalOpen(false);
        },
        onError: (error: any) => {
            console.error('Project creation failed:', error);
            alert(`Failed to create project: ${error.message || 'Unknown error'}`);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const { error } = await supabase
                .from('projects')
                .update(data)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setEditingProject(null);
            setIsProjectModalOpen(false);
        },
        onError: (error: any) => {
            console.error('Project update failed:', error);
            alert(`Failed to update project: ${error.message || 'Unknown error'}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setProjectToDelete(null);
        }
    });

    const leaveMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const { error } = await supabase
                .from('project_members')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', currentUser.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setProjectToLeave(null);
        }
    });

    const activeFiltersCount = [
        statusFilter !== 'ALL',
        dateFilter !== 'ALL',
        ownerFilter !== 'ALL',
        searchTerm !== ''
    ].filter(Boolean).length;

    const resetFilters = () => {
        setStatusFilter('ALL');
        setDateFilter('ALL');
        setOwnerFilter('ALL');
        setSearchTerm('');
    };

    const filteredProjects = useMemo(() => {
        let result = Array.isArray(projects) ? [...projects] : [];

        if (debouncedSearchTerm) {
            const lowerQuery = debouncedSearchTerm.toLowerCase();
            result = result.filter(project =>
                project.title.toLowerCase().includes(lowerQuery) ||
                project.description.toLowerCase().includes(lowerQuery)
            );
        }

        if (statusFilter !== 'ALL') {
            result = result.filter(project => project.status === statusFilter);
        }

        if (ownerFilter === 'ME') {
            result = result.filter(project => project.ownerId === currentUser.id);
        }

        if (dateFilter !== 'ALL') {
            const now = new Date();
            result = result.filter(project => {
                const projDate = new Date(project.createdAt);
                const diffTime = Math.abs(now.getTime() - projDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (dateFilter === 'LAST_7') return diffDays <= 7;
                if (dateFilter === 'LAST_30') return diffDays <= 30;
                if (dateFilter === 'LAST_90') return diffDays <= 90;
                return true;
            });
        }

        return result;
    }, [projects, debouncedSearchTerm, statusFilter, dateFilter, ownerFilter]);

    const visibleProjects = useMemo(() => {
        return filteredProjects.slice(0, displayCount);
    }, [filteredProjects, displayCount]);

    const handleMenuClick = useCallback((e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        setActiveMenuId(prev => prev === projectId ? null : projectId);
    }, []);

    const handleDeleteProject = useCallback((e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenuId(null);
        setProjectToDelete(project);
    }, []);

    const handleLeaveProject = useCallback((e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenuId(null);
        setProjectToLeave(project);
    }, []);

    const handleEditProject = useCallback((e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenuId(null);
        setEditingProject(project);
        setIsProjectModalOpen(true);
    }, []);

    const handleCreateClick = () => {
        setEditingProject(undefined);
        setIsProjectModalOpen(true);
    };

    const handleStatusChange = useCallback((e: React.MouseEvent, project: Project, newStatus: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED') => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenuId(null);
        updateMutation.mutate({ id: project.id, data: { status: newStatus } });
    }, [updateMutation]);

    const confirmDeleteProject = () => {
        if (projectToDelete) {
            deleteMutation.mutate(projectToDelete.id);
        }
    };

    const confirmLeaveProject = () => {
        if (projectToLeave) {
            leaveMutation.mutate(projectToLeave.id);
        }
    };

    const handleProjectModalSave = (e: React.FormEvent, projectData: Partial<Project>) => {
        e.preventDefault();

        if (editingProject) {
            updateMutation.mutate({
                id: editingProject.id,
                data: {
                    title: projectData.title,
                    description: projectData.description,
                    status: projectData.status,
                    settings: projectData.settings,
                    investment_balance: projectData.investmentBalance
                }
            });
        } else {
            // Check budget
            const targetBudget = projectData.investmentBalance || 0;
            if (projectData.settings?.billingMode === 'PROJECT_INVESTMENT' && targetBudget > 0) {
                if (currentUser.scansBalance < targetBudget) {
                    alert("Insufficient balance for this project budget.");
                    return;
                }
                // Deduct balance (handled in App/Context usually, but here we sync)
                if (onUpdateUser) {
                    onUpdateUser({ scansBalance: currentUser.scansBalance - targetBudget }, true);
                }
            }

            createMutation.mutate({
                title: projectData.title || 'Untitled Project',
                description: projectData.description || '',
                owner_id: currentUser.id,
                status: projectData.status || 'ACTIVE',
                settings: projectData.settings,
                investment_balance: 0, // Start at 0, transfer after creation
                total_invested: 0
            }, {
                onSuccess: async (newProj) => {
                    if (targetBudget > 0) {
                        const { data, error } = await supabase.rpc('transfer_project_funds', {
                            p_project_id: newProj.id,
                            p_amount: targetBudget,
                            p_action: 'DEPOSIT'
                        });

                        if (error) {
                            console.error('Initial deposit failed:', error);
                            alert("Project created but initial budget transfer failed: " + error.message);
                        } else {
                            const result = data as { success: boolean; error?: string };
                            if (result && !result.success) {
                                alert("Project created but initial budget transfer failed: " + result.error);
                            }
                        }
                    }
                }
            });
        }
    };

    const handleLoadMore = () => setDisplayCount(prev => prev + PROJECTS_PER_PAGE);

    return {
        projects,
        searchTerm,
        setSearchTerm,
        viewMode,
        setViewMode,
        displayCount,
        statusFilter,
        setStatusFilter,
        dateFilter,
        setDateFilter,
        ownerFilter,
        setOwnerFilter,
        activeMenuId,
        setActiveMenuId,
        isProjectModalOpen,
        setIsProjectModalOpen,
        editingProject,
        projectToLeave,
        setProjectToLeave,
        projectToDelete,
        setProjectToDelete,
        activeFiltersCount,
        resetFilters,
        filteredProjects,
        visibleProjects,
        handleMenuClick,
        handleDeleteProject,
        handleLeaveProject,
        handleEditProject,
        handleCreateClick,
        handleStatusChange,
        confirmDeleteProject,
        confirmLeaveProject,
        handleProjectModalSave,
        handleLoadMore,
        loading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || leaveMutation.isPending
    };
};
