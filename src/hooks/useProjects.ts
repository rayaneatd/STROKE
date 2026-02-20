import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, User, ProjectRole, ProjectId } from '../types';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { getOrgNamesFromEmails } from '../utils/emailDomains';

const PROJECTS_PER_PAGE = 12;

interface UseProjectsProps {
    currentUser: User;
    onUpdateUser?: (data: Partial<User>, sync?: boolean) => void;
    onNavigate: (page: string) => void;
}

export const useProjects = ({ currentUser, onUpdateUser, onNavigate }: UseProjectsProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [displayCount, setDisplayCount] = useState(PROJECTS_PER_PAGE);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'>('ALL');
    const [dateFilter, setDateFilter] = useState<'ALL' | 'LAST_7' | 'LAST_30' | 'LAST_90'>('ALL');
    const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'ME'>('ALL');
    const [orgFilter, setOrgFilter] = useState<string>('ALL');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

    const [projectToLeave, setProjectToLeave] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    // Fetch Projects via Secure Function
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects', currentUser.id],
        queryFn: async () => {
            const { data, error } = await supabase
                 .rpc('get_user_projects', { target_user_id: currentUser.id });

            if (error) throw error;
            if (!data) return [];

            return data.map((p: any) => {
                 if (!p) return null; // Skip invalid entries
                 try {
                     return {
                        id: p.id,
                        title: p.title || 'Untitled Project',
                        description: p.description || '',
                        ownerId: p.owner_id,
                        createdAt: p.created_at || new Date().toISOString(),
                        status: p.status || 'ACTIVE',
                        settings: p.settings || {},
                        investmentBalance: Number(p.investment_balance) || 0,
                        totalInvested: Number(p.total_invested) || 0,
                        fileCount: 0, 
                        memberCount: Number(p.member_count) || 0,
                        members: Array.isArray(p.members) ? p.members.map((m: any) => {
                            if (!m || !m.userId) return null;
                            return {
                                userId: m.userId,
                                role: m.role as ProjectRole,
                                permissions: m.permissions || [],
                                scansUsed: m.scansUsed || 0,
                                scanQuota: (m.scanQuota === 'UNLIMITED' || String(m.scanQuota) === '-1') ? 'UNLIMITED' : Number(m.scanQuota),
                                joinedAt: m.joinedAt,
                                user: m.user ? {
                                    id: m.user.id,
                                    email: m.user.email,
                                    displayName: m.user.displayName || m.user.email?.split('@')[0] || 'Unknown',
                                    avatarUrl: m.user.avatarUrl,
                                    scansBalance: m.user.scansBalance ?? m.user.scans_balance ?? 0,
                                    workMails: Array.isArray(m.user.workMails) ? m.user.workMails : [],
                                    orgNames: Array.isArray(m.user.orgNames) ? m.user.orgNames : []
                                } : undefined
                            };
                        }).filter(Boolean) : [] // Filter out null members
                    } as Project;
                } catch (err) {
                    console.error('Error parsing project:', err, p);
                    return null;
                }
            }).filter(Boolean); // Filter out null projects
        },
        enabled: !!currentUser?.id
    });

    // Real-time Subscription
    // DISABLED: Temporarily disabled to debug infinite loop/lag issues
    /*
    useEffect(() => {
        const channel = supabase
            .channel('projects_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, () => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, () => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'projects' }, () => {
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
    */

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
    }, [debouncedSearchTerm, statusFilter, dateFilter, ownerFilter, orgFilter]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: async ({ projectData, ownerId, investmentAmount }: { projectData: any, ownerId: string, investmentAmount: number }) => {
            const { data, error } = await supabase.rpc('create_project_with_funding', {
                p_project_data: projectData,
                p_owner_id: ownerId,
                p_investment_amount: investmentAmount
            });
            
            if (error) throw error;
            const result = data as { success: boolean; error?: string; new_balance?: number };
            if (!result.success) throw new Error(result.error || 'Project creation failed');
            
            return result;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            if (data.new_balance !== undefined && data.new_balance !== null && onUpdateUser) {
                onUpdateUser({ scansBalance: data.new_balance }, true);
            }
            setIsProjectModalOpen(false);
        },
        onError: (error: any) => {
            console.error('Project creation failed:', error);
            alert(t('projects.errors.createFailed', { error: error.message || t('common.unknown') }));
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const { error } = await supabase.rpc('update_project', {
                p_project_id: id,
                p_title: data.title,
                p_description: data.description,
                p_status: data.status,
                p_settings: data.settings
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setEditingProject(null);
            setIsProjectModalOpen(false);
        },
        onError: (error: any) => {
            console.error('Project update failed:', error);
            alert(t('projects.errors.updateFailed', { error: error.message || t('common.unknown') }));
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

    const fundProjectMutation = useMutation({
        mutationFn: async ({ projectId, amount, action }: { projectId: string, amount: number, action: 'DEPOSIT' | 'WITHDRAW' }) => {
            const { data, error } = await supabase.rpc('transfer_project_funds', {
                p_project_id: projectId,
                p_amount: amount,
                p_action: action
            });
            if (error) throw error;
            const result = data as { success: boolean; error?: string; user_balance: number };
            if (result && !result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            if (onUpdateUser && data) {
                onUpdateUser({ scansBalance: data.user_balance }, true);
            }
        }
    });

    const activeFiltersCount = [
        statusFilter !== 'ALL',
        dateFilter !== 'ALL',
        ownerFilter !== 'ALL',
        orgFilter !== 'ALL',
        searchTerm !== ''
    ].filter(Boolean).length;

    const resetFilters = () => {
        setStatusFilter('ALL');
        setDateFilter('ALL');
        setOwnerFilter('ALL');
        setOrgFilter('ALL');
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

        if (orgFilter !== 'ALL') {
            result = result.filter(project =>
                project.members.some(m => m.user?.orgNames?.includes(orgFilter))
            );
        }

        return result;
    }, [projects, debouncedSearchTerm, statusFilter, dateFilter, ownerFilter, orgFilter]);

    const orgOptions = useMemo(() => {
        const set = new Set<string>();
        projects.forEach(project => {
            project.members.forEach(m => {
                (m.user?.orgNames || []).forEach((org) => set.add(org));
            });
        });
        return Array.from(set.values());
    }, [projects]);

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
                    settings: projectData.settings
                    // investment_balance is handled via fund/withdraw actions
                }
            });
        } else {
            const targetBudget = (projectData.settings?.billingMode === 'PROJECT_INVESTMENT') 
                ? (projectData.investmentBalance || 0) 
                : 0;

            if (targetBudget > 0 && currentUser.scansBalance < targetBudget) {
                alert(t('projects.errors.insufficientBalance'));
                return;
            }

            createMutation.mutate({
                projectData: {
                    title: projectData.title || 'Untitled Project',
                    description: projectData.description || '',
                    status: projectData.status || 'ACTIVE',
                    settings: projectData.settings
                },
                ownerId: currentUser.id,
                investmentAmount: targetBudget
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
        orgFilter,
        setOrgFilter,
        orgOptions,
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
        fundProjectMutation,
        loading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || leaveMutation.isPending
    };
};
