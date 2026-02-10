import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_PROJECTS, updateProject, getProjectAnalytics, generateReport, getUser, notifyOwner, processScanTransaction, markCandidateContacted, updateMemberPreferredEmail } from '../services/mockData';
import { Project, ProjectRole, User as UserType, ProjectFile, OutreachStrategy } from '../types';
import { useFileProcessing } from './useFileProcessing';

interface UseProjectDetailProps {
    projectId: string;
    onBack: () => void;
    currentUser: UserType;
    onNavigate: (page: string) => void;
    onUpdateUser?: (user: UserType) => void;
}

export const useProjectDetail = ({ projectId, onBack, currentUser, onNavigate, onUpdateUser }: UseProjectDetailProps) => {
    const [project, setProject] = useState<Project | undefined>(() => {
        const p = MOCK_PROJECTS.find(pr => pr.id === projectId);
        return p ? { ...p, members: [...p.members] } : undefined;
    });

    const [isIdentitySelectorOpen, setIsIdentitySelectorOpen] = useState(false);
    const [addMemberType, setAddMemberType] = useState<'ADMIN' | 'EMPLOYEE' | 'VISITOR' | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isNoScansModalOpen, setIsNoScansModalOpen] = useState(false);
    const [isOwnerBannedModalOpen, setIsOwnerBannedModalOpen] = useState(false);
    const [isProjectLockedModalOpen, setIsProjectLockedModalOpen] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const [quotaError, setQuotaError] = useState<string | null>(null);

    useEffect(() => {
        if (!project) return;

        const checkOwnerStatus = () => {
            const owner = getUser(project.ownerId);
            // If owner is banned and the modal isn't already open
            if (owner?.isBanned && !isOwnerBannedModalOpen) {
                setIsOwnerBannedModalOpen(true);
            }
        };

        // Check immediately on mount
        checkOwnerStatus();

        // Poll every 3 seconds
        const interval = setInterval(checkOwnerStatus, 3000);
        return () => clearInterval(interval);
    }, [project?.ownerId, isOwnerBannedModalOpen]);

    useEffect(() => {
        const freshProject = MOCK_PROJECTS.find(p => p.id === projectId);

        if (freshProject && freshProject.status === 'COMPLETED' && freshProject.settings.analystAccessOnlyForCompleted) {
            const memberRecord = freshProject.members.find(m => m.userId === currentUser.id);
            const isOwner = freshProject.ownerId === currentUser.id;
            const isAdmin = memberRecord?.role === ProjectRole.ADMIN;
            const hasAnalyzePerm = memberRecord?.permissions.includes('ANALYZE');

            if (!isOwner && !isAdmin && !hasAnalyzePerm) {
                onBack();
                return;
            }
        }

        setProject(freshProject ? { ...freshProject, members: [...freshProject.members] } : undefined);
    }, [projectId, currentUser.id, onBack]);

    // Click outside to close identity selector
    useEffect(() => {
        if (isIdentitySelectorOpen) {
            const handleClickOutside = () => setIsIdentitySelectorOpen(false);
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isIdentitySelectorOpen]);

    const {
        files,
        setFiles,
        isUploading,
        addFiles,
        removeFile,
        retryFile,
        queueFilesForProcessing
    } = useFileProcessing(projectId, currentUser, project, setProject);

    const initialTab = useMemo(() => {
        if (!project) return 'overview';
        const me = project.members.find(m => m.userId === currentUser.id);
        if (!me) return 'overview';
        if (me.role === ProjectRole.OWNER || me.role === ProjectRole.ADMIN) return 'overview';
        if (me.permissions.includes('ANALYZE')) return 'overview';
        if (me.permissions.includes('SCAN')) return 'resumes';
        return 'team';
    }, [project, currentUser.id]);

    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'resumes' | 'discussions' | 'activity'>(initialTab);

    // Derived Project Data
    const projectOwner = project ? getUser(project.ownerId) : undefined;
    const ownerScans = projectOwner ? projectOwner.scansBalance : 0;

    const isInvestmentMode = project?.settings.billingMode === 'PROJECT_INVESTMENT';
    const displayBalance = isInvestmentMode ? project?.investmentBalance : ownerScans;

    const currentMemberRecord = project?.members.find(m => m.userId === currentUser.id);
    const currentUserRole = currentMemberRecord?.role;
    const currentPermissions = currentMemberRecord?.permissions || [];

    const isProjectOwner = currentUser.id === project?.ownerId;
    const isAdmin = currentUserRole === ProjectRole.ADMIN;
    const isAnalyst = !isAdmin && !isProjectOwner && currentPermissions.includes('ANALYZE') && !currentPermissions.includes('SCAN');
    const isScout = !isAdmin && !isProjectOwner && currentPermissions.includes('SCAN') && !currentPermissions.includes('ANALYZE');

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

    const canViewActivityTab = isProjectOwner || isAdmin || (isAnalyst && project?.settings.analystCanViewActivity);

    const canUseAntiGhosting = isProjectOwner || isAdmin ||
        (isAnalyst && project?.settings.analystCanUseGhosting) ||
        (isScout && project?.settings.scoutCanUseGhosting);

    const analytics = useMemo(() => getProjectAnalytics(projectId), [files, project?.members, projectId]);

    const contributionData = useMemo(() => project?.members.map(m => {
        return { scans: m.scansUsed, role: m.role };
    }), [project?.members]);

    const topCandidates = useMemo(() => files
        .filter(f => f.score && f.score > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5), [files]);

    // Actions
    const handleEditClick = () => {
        if (canEditProject) {
            setIsEditModalOpen(true);
        }
    };

    const handleExport = () => {
        const url = generateReport('CSV', 'PROJECT', projectId);
        const a = document.createElement('a');
        a.href = url;
        a.download = `airecruit_project_${projectId}_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleMarkContacted = (fileId: string) => {
        const updatedFile = markCandidateContacted(fileId, currentUser.id);
        if (updatedFile) {
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, emailSentAt: updatedFile.emailSentAt, emailSentBy: updatedFile.emailSentBy, lastContactedAt: updatedFile.lastContactedAt, emailDraft: undefined } : f));
        }
    };

    const handleBatchUpdate = (updates: { id: string, changes: Partial<ProjectFile> }[]) => {
        setFiles(prev => prev.map(f => {
            const update = updates.find(u => u.id === f.id);
            return update ? { ...f, ...update.changes } : f;
        }));
    };

    const saveProjectChanges = (e: React.FormEvent, updatedProject: Partial<Project>) => {
        e.preventDefault();
        if (!updatedProject.id) return;
        updateProject(updatedProject.id, updatedProject);
        setProject(prev => prev ? ({ ...prev, ...updatedProject } as Project) : prev);
        setIsEditModalOpen(false);
    };

    const handleStartScan = () => {
        if (!project || !canScan) {
            setIsProjectLockedModalOpen(true);
            return;
        }

        setQuotaError(null);

        const currentOwner = getUser(project.ownerId);
        if (currentOwner?.isBanned) {
            setIsOwnerBannedModalOpen(true);
            return;
        }

        const pendingFiles = files.filter(f => f.status === 'PENDING');
        if (pendingFiles.length === 0) return;

        const result = processScanTransaction(project.id, currentUser.id, pendingFiles.length);

        if (result.success) {
            if (result.updatedProject) {
                setProject(result.updatedProject);
            }
            if (isProjectOwner && result.updatedUser && onUpdateUser) {
                onUpdateUser(result.updatedUser);
            }

            // Delegate to hook
            queueFilesForProcessing(pendingFiles);

        } else {
            if (result.error?.includes('quota')) {
                setQuotaError(result.error);
            } else if (result.error?.includes('Overage') || result.error?.includes('Insufficient') || result.error?.includes('budget depleted')) {
                if (isProjectOwner) {
                    if (isInvestmentMode) {
                        alert(result.error + " Please update project budget.");
                        setIsEditModalOpen(true);
                    } else {
                        setIsUpgradeModalOpen(true);
                    }
                } else {
                    setIsNoScansModalOpen(true);
                }
            } else {
                alert(result.error);
            }
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
        updateMemberPreferredEmail(projectId, currentUser.id, emailId);
        // Optimistic Update
        setProject(prev => {
            if (!prev) return prev;
            const updatedMembers = prev.members.map(m =>
                m.userId === currentUser.id ? { ...m, preferredOutreachEmailId: emailId } : m
            );
            return { ...prev, members: updatedMembers };
        });
        setIsIdentitySelectorOpen(false);
    };

    // Identity Logic for Header
    const isCentralized = project?.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY;
    const showIdentitySelector = canUseAntiGhosting && !isCentralized;
    const showCentralizedBadge = canUseAntiGhosting && isCentralized;

    const currentIdentityId = currentMemberRecord?.preferredOutreachEmailId;
    const activeEmail = currentUser.emailIntegrations.find(e => e.id === currentIdentityId);

    // If centralized, fetch owner email
    let centralizedEmailAddress = '...';
    if (isCentralized && project?.settings.ownerOutreachEmailId) {
        // In a real app we might not have ownerUser fully loaded if we aren't owner/admin, 
        // but mockData getUser() works synchronously.
        const ownerUser = getUser(project.ownerId);
        const emailObj = ownerUser?.emailIntegrations.find(e => e.id === project.settings.ownerOutreachEmailId);
        if (emailObj) centralizedEmailAddress = emailObj.emailAddress;
    }

    return {
        project,
        setProject,
        isIdentitySelectorOpen,
        setIsIdentitySelectorOpen,
        activeTab,
        setActiveTab,
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
        files,
        isUploading,
        removeFile,
        retryFile,
        projectOwner,
        ownerScans,
        isInvestmentMode,
        displayBalance,
        canManageTeam,
        canChat,
        canScan,
        canEditProject,
        canViewOverview,
        canViewResumes,
        canAccessAdminChannel,
        canViewActivityTab,
        canUseAntiGhosting,
        analytics,
        contributionData,
        topCandidates,
        handleEditClick,
        handleExport,
        handleMarkContacted,
        handleBatchUpdate,
        saveProjectChanges,
        handleStartScan,
        handleFilesAdded,
        handleIdentityChange,
        showCentralizedBadge,
        centralizedEmailAddress,
        showIdentitySelector,
        activeEmail,
        currentIdentityId,
        isProjectOwner,
        isAdmin,
        isAnalyst,
        isScout,
        isActive,
        isArchived,
        isCompleted,

    };
};
