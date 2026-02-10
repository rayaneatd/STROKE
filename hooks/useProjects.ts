import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MOCK_PROJECTS, MOCK_USERS, deleteProject, updateProject, removeProjectMember, getUser, updateUser } from '../services/mockData';
import { Project, User, ProjectRole } from '../types';

const PROJECTS_PER_PAGE = 12;

interface UseProjectsProps {
    currentUser: User;
    onUpdateUser?: (user: User) => void;
    onNavigate: (page: string) => void;
}

export const useProjects = ({ currentUser, onUpdateUser, onNavigate }: UseProjectsProps) => {
    const [projects, setProjects] = useState<Project[]>([]);

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

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        setProjects([...MOCK_PROJECTS]);
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        setDisplayCount(PROJECTS_PER_PAGE);
    }, [debouncedSearchTerm, statusFilter, dateFilter, ownerFilter]);

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
        let result = projects.filter(project => {
            const memberRecord = project.members.find(m => m.userId === currentUser.id);
            const isMember = !!memberRecord;
            const isOwner = project.ownerId === currentUser.id;

            if (!isMember && !isOwner) return false;

            const isAdmin = memberRecord?.role === ProjectRole.ADMIN;

            if (project.status === 'ARCHIVED') {
                if (!isOwner && !isAdmin) return false;
            }

            if (project.status === 'COMPLETED' && project.settings.analystAccessOnlyForCompleted) {
                const hasAnalyzePerm = memberRecord?.permissions.includes('ANALYZE');
                if (!isOwner && !isAdmin && !hasAnalyzePerm) return false;
            }

            return true;
        });

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
    }, [projects, debouncedSearchTerm, statusFilter, dateFilter, ownerFilter, currentUser.id]);

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
        setEditingProject(project); // Set the project to edit
        setIsProjectModalOpen(true);
    }, []);

    const handleCreateClick = () => {
        setEditingProject(undefined); // Clear for create mode
        setIsProjectModalOpen(true);
    };

    const handleStatusChange = useCallback((e: React.MouseEvent, project: Project, newStatus: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED') => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenuId(null);
        updateProject(project.id, { status: newStatus });
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } as Project : p));
    }, []);

    const confirmDeleteProject = () => {
        if (projectToDelete) {
            const updatedOwner = deleteProject(projectToDelete.id);
            if (updatedOwner && updatedOwner.id === currentUser.id && onUpdateUser) {
                onUpdateUser(updatedOwner);
            }
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
        }
    };

    const confirmLeaveProject = () => {
        if (projectToLeave) {
            removeProjectMember(projectToLeave.id, currentUser.id);
            setProjects(prev => prev.filter(p => p.id !== projectToLeave.id));
            setProjectToLeave(null);
        }
    };

    const handleProjectModalSave = (e: React.FormEvent, projectData: Partial<Project>) => {
        e.preventDefault();

        if (projectData.id) {
            // EDIT MODE
            updateProject(projectData.id, projectData);
            setProjects(prev => prev.map(p => p.id === projectData.id ? { ...p, ...projectData } as Project : p));
        } else {
            // CREATE MODE
            let investmentBalance = projectData.investmentBalance || 0;
            let ownerUpdated = false;
            let newOwnerState = { ...currentUser };

            if (investmentBalance > 0 && projectData.settings?.billingMode === 'PROJECT_INVESTMENT') {
                const owner = getUser(currentUser.id);
                if (owner && owner.scansBalance >= investmentBalance) {
                    owner.scansBalance -= investmentBalance;
                    updateUser(currentUser.id, { scansBalance: owner.scansBalance });
                    newOwnerState = { ...owner };
                    ownerUpdated = true;
                } else {
                    alert("Insufficient funds for initial project budget. Creating with 0 budget.");
                    investmentBalance = 0;
                }
            } else {
                investmentBalance = 0;
            }

            if (ownerUpdated && onUpdateUser) {
                onUpdateUser(newOwnerState);
            }

            const newProject: Project = {
                id: `proj-${Date.now()}` as any,
                title: projectData.title || 'Untitled Project',
                description: projectData.description || '',
                ownerId: currentUser.id,
                createdAt: new Date().toISOString().split('T')[0],
                fileCount: 0,
                memberCount: 1,
                status: projectData.status || 'ACTIVE',
                settings: projectData.settings as any,
                members: [{
                    userId: currentUser.id,
                    role: ProjectRole.OWNER,
                    permissions: ['SCAN', 'ANALYZE'],
                    scansUsed: 0,
                    scanQuota: 'UNLIMITED',
                    joinedAt: new Date().toISOString().split('T')[0]
                }],
                investmentBalance: investmentBalance,
                totalInvested: investmentBalance
            };

            setProjects(prev => [newProject, ...prev]);
            MOCK_PROJECTS.unshift(newProject);
        }
        setIsProjectModalOpen(false);
    };

    const handleLoadMore = () => {
        setDisplayCount(prev => prev + PROJECTS_PER_PAGE);
    };

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
        handleLoadMore
    };
};
