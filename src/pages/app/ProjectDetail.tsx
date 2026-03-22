import React, { useEffect } from 'react';
import { notifyOwner } from '../../services/mockData';
import { ProjectDetailSkeleton } from '../../components/SkeletonLoader';
import {
    ArrowLeft, Edit2, Clock, BarChart2, FileText, Briefcase, MessageSquare, ChevronUp, ChevronDown, Zap, AlertTriangle, Coins, Activity, AtSign, Check, Link, Mail, Shield, Cpu, Search
} from 'lucide-react';
import { User as UserType } from '../../types';
import { useProjectDetail } from '../../hooks/useProjectDetail';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

// Tab Components
import OverviewTab from './project-tabs/OverviewTab';
import ResumesTab from './project-tabs/ResumesTab';
import TeamTab from './project-tabs/TeamTab';
import DiscussionsTab from './project-tabs/DiscussionsTab';
import ActivityTab from './project-tabs/ActivityTab';

// Modal Components
import AddMemberModal from '../../components/modals/AddMemberModal';
import EditProjectModal from '../../components/modals/EditProjectModal';
import UpgradePlanModal from '../../components/modals/UpgradePlanModal';
import NoScansModal from '../../components/modals/NoScansModal';
import QuotaExceededModal from '../../components/modals/QuotaExceededModal';
import OwnerBannedModal from '../../components/modals/OwnerBannedModal';
import ProjectLockedModal from '../../components/modals/ProjectLockedModal';
import LowScansBanner from '../../components/LowScansBanner';
import ProjectBudgetBanner from '../../components/ProjectBudgetBanner';

interface ProjectDetailProps {
    projectId: string;
    onBack: () => void;
    deductScans: (amount: number, ownerId?: string) => boolean;
    currentUser: UserType;
    onNavigate: (page: string) => void;
    onUpdateUser?: (user: UserType) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, deductScans, currentUser, onNavigate, onUpdateUser }) => {
    const { t } = useTranslation(); // Initialize hook
    const {
        project,
        activeTab,
        setActiveTab,
        files,
        isUploading,
        isProjectLoading,
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
        setProject,
        removeFile,
        retryFile,
        projectOwner,
        ownerScans,
        currentMemberQuota,
        currentMemberUsed,
        isInvestmentMode,
        displayBalance,
        centralizedEmailAddress,
        addMember,
        removeMember,
        updateMember,
        fundProject,
        withdrawFunds,
        updateProject,
        isActionLoading,
        quotaError,
        setQuotaError,
        markViewed,
        markExported
    } = useProjectDetail({
        projectId: projectId,
        onBack: onBack,
        currentUser,
        onNavigate,
        onUpdateUser
    });

    // Theme Helpers
    const theme = currentUser.preferences?.uiConfig?.theme || 'DARK';
    const isLight = theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';

    // Fetch AI model used for this project (based on owner's preferences)
    const aiModelQueryClient = useQueryClient();
    const { data: aiModel } = useQuery({
        queryKey: ['project-ai-model', projectId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_project_ai_model' as any, {
                p_project_id: projectId
            });
            if (error) return 'MERCURY_2';
            return (data as string) || 'MERCURY_2';
        },
        enabled: !!projectId,
    });

    // Real-time: re-fetch when the owner changes their profile (e.g. AI model in settings)
    useEffect(() => {
        if (!project?.ownerId) return;
        const channel = supabase
            .channel(`owner-profile-ai-${project.ownerId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${project.ownerId}`
            }, () => {
                aiModelQueryClient.invalidateQueries({ queryKey: ['project-ai-model', projectId] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [project?.ownerId, projectId, aiModelQueryClient]);

    const AI_MODEL_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        'MERCURY_2': {
            label: t('settings.ai.model.mercury2.name'),
            color: isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/10 text-sky-400 border-sky-500/20',
            icon: (
                <svg width="12" height="12" viewBox="0 0 100 100" fill="none">
                    <path d="M18 50 Q32 30 50 50 Q68 70 82 50" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none" />
                    <circle cx="50" cy="50" r="8" fill="currentColor" />
                </svg>
            )
        },
        'MISTRAL': {
            label: t('settings.ai.model.mistral.name'),
            color: isLight ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            icon: (
                <svg width="12" height="12" viewBox="0 0 100 100" fill="none">
                    <rect x="10" y="10" width="28" height="80" rx="4" fill="currentColor" />
                    <rect x="10" y="10" width="80" height="28" rx="4" fill="currentColor" />
                    <rect x="36" y="10" width="28" height="56" rx="4" fill="currentColor" />
                    <rect x="10" y="38" width="54" height="28" rx="4" fill="#FF7000" />
                    <rect x="62" y="10" width="28" height="80" rx="4" fill="currentColor" />
                </svg>
            )
        }
    };
    const currentAIModel = AI_MODEL_INFO[aiModel || 'MERCURY_2'] || AI_MODEL_INFO['MERCURY_2'];

    if (isProjectLoading) return <ProjectDetailSkeleton />;

    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    if (!project) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className={`p-4 rounded-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                <Search size={48} className={isLight ? 'text-slate-300' : 'text-zinc-600'} />
            </div>
            <div className="text-center">
                <h3 className={`text-lg font-bold ${textPrimary}`}>Project not found</h3>
                <p className={`text-sm ${textSecondary}`}>The project you're looking for doesn't exist or you don't have access.</p>
            </div>
            <button
                onClick={() => onNavigate('projects')}
                className={`px-6 py-2 rounded-xl bg-${accentColor}-500 text-white font-bold text-sm hover:bg-${accentColor}-600 transition-colors shadow-lg shadow-${accentColor}-500/20`}
            >
                Back to Projects
            </button>
        </div>
    );

    // Light/Dark Classes
    const backBtnClass = isLight
        ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        : 'text-zinc-400 hover:text-white hover:bg-white/10';

    const titleClass = isLight ? 'text-slate-900' : 'text-white';
    const descClass = isLight ? 'text-slate-500' : 'text-zinc-500';
    const editBtnClass = isLight
        ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm'
        : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10';

    const tabClass = (isActive: boolean) => {
        if (isActive) return `text-${accentColor}-600 font-bold border-b-2 border-${accentColor}-500`;
        return isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5';
    };

    const tabBadgeClass = isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-zinc-300';

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
                <div className="flex items-start gap-4">
                    <button onClick={onBack} className={`mt-1 p-2 rounded-full transition-colors ${backBtnClass}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className={`text-2xl font-bold tracking-tight ${titleClass}`}>{project.title}</h1>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${project.status === 'ACTIVE'
                                ? `bg-${accentColor}-500/10 text-${accentColor}-500 border-${accentColor}-500/20`
                                : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                {project.status}
                            </span>
                        </div>

                        <div className="relative mt-1">
                            <p
                                className={`max-w-2xl text-sm leading-relaxed transition-all duration-300 whitespace-pre-wrap ${descClass} ${isDescriptionExpanded ? '' : 'line-clamp-1'}`}
                                title={project.description}
                            >
                                {project.description}
                            </p>
                            {project.description.length > 100 && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className={`text-[10px] font-bold text-${accentColor}-500 hover:underline flex items-center gap-0.5 mt-0.5`}
                                >
                                    {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                                    {isDescriptionExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                            )}
                        </div>

                        <div className={`flex flex-wrap items-center gap-4 mt-2 text-xs font-medium ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} /> {t('project.created')} {new Date(project.createdAt).toLocaleDateString()}
                            </div>

                            {/* AI Model Badge */}
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-semibold ${currentAIModel.color}`} title={`Scanning powered by ${currentAIModel.label}`}>
                                <Cpu size={10} />
                                {currentAIModel.icon}
                                <span>AI: {currentAIModel.label}</span>
                            </div>

                            {isInvestmentMode ? (
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${displayBalance === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                    <Coins size={10} className="fill-current" />
                                    {t('project.budget')}: {displayBalance}
                                </div>
                            ) : (
                                projectOwner && (
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${displayBalance < 0 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : `bg-${accentColor}-500/10 text-${accentColor}-500 border-${accentColor}-500/20`}`}>
                                        <Zap size={10} className="fill-current" />
                                        {displayBalance < 0 ? `${t('project.overage')}: ${displayBalance}` : `${t('project.balance')}: ${displayBalance}`}
                                    </div>
                                )
                            )}

                            {/* Sender Identity Display (Fixed if Centralized) */}
                            {showCentralizedBadge && (
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border cursor-default ${isLight
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    }`} title="Emails are sent via the Project Owner's centralized address.">
                                    <Shield size={10} className="fill-current" />
                                    <span className="truncate max-w-[200px]">Via: {centralizedEmailAddress}</span>
                                </div>
                            )}

                            {/* Sender Identity Selector (Editable if Individual) */}
                            {showIdentitySelector && (
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsIdentitySelectorOpen(!isIdentitySelectorOpen); }}
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all ${activeEmail
                                            ? (isLight ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20')
                                            : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-zinc-400 border-white/10')
                                            }`}
                                    >
                                        <AtSign size={10} />
                                        {activeEmail ? <span className="truncate max-w-[150px]">{activeEmail.emailAddress}</span> : t('project.selectSendingEmail')}
                                        <ChevronDown size={10} />
                                    </button>

                                    {isIdentitySelectorOpen && (
                                        <div onClick={e => e.stopPropagation()} className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl border z-50 overflow-hidden animate-fade-in-up p-2 ${isLight ? 'bg-white border-slate-100' : 'bg-[#18181b] border-white/10'}`}>
                                            <div className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>{t('project.sendingAs')}:</div>
                                            <div className="space-y-1">
                                                {currentUser.emailIntegrations.length > 0 ? (
                                                    currentUser.emailIntegrations.map(email => (
                                                        <button
                                                            key={email.id}
                                                            onClick={() => handleIdentityChange(email.id)}
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${currentIdentityId === email.id
                                                                ? (isLight ? `bg-blue-50 text-blue-700` : `bg-blue-500/10 text-blue-400`)
                                                                : (isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-400 hover:bg-white/5')
                                                                }`}
                                                        >
                                                            <span className="truncate">{email.emailAddress}</span>
                                                            {currentIdentityId === email.id && <Check size={12} />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center">
                                                        <p className={`text-xs mb-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{t('project.noEmailsConnected')}</p>
                                                        <button
                                                            onClick={() => onNavigate('profile')}
                                                            className={`text-xs font-bold flex items-center justify-center gap-1 w-full py-1.5 rounded bg-${accentColor}-600 text-white hover:bg-${accentColor}-500`}
                                                        >
                                                            <Link size={10} /> {t('project.actions.connectEmail')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {canEditProject && (
                        <button
                            onClick={handleEditClick}
                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${editBtnClass}`}
                        >
                            <Edit2 size={14} /> {t('project.actions.editProject')}
                        </button>
                    )}
                </div>
            </div>

            <LowScansBanner balance={ownerScans} onBuy={() => onNavigate('buy-scans')} />
            {isInvestmentMode && isProjectOwner && (
                <ProjectBudgetBanner
                    project={project}
                    ownerBalance={ownerScans}
                    onFundProject={() => setIsEditModalOpen(true)}
                    onBuyScans={() => onNavigate('buy-scans')}
                />
            )}
            {quotaError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-between text-red-400 text-sm animate-fade-in">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span className="font-bold">{t('project.errors.scanFailed')}</span> {quotaError}
                    </div>
                    <button onClick={() => setQuotaError(null)} className="text-red-400 hover:text-white">{t('project.actions.dismiss')}</button>
                </div>
            )}

            {/* --- TABS --- */}
            <div className={`border-b mb-6 flex gap-6 shrink-0 overflow-x-auto no-scrollbar ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                {canViewOverview && (
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'overview')}`}
                    >
                        <BarChart2 size={16} /> {t('project.tabs.overview')}
                    </button>
                )}

                {canViewActivityTab && (
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'activity')}`}
                    >
                        <Activity size={16} /> {t('project.tabs.activityAudit')}
                    </button>
                )}

                {canViewResumes && (
                    <button
                        onClick={() => setActiveTab('resumes')}
                        className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'resumes')}`}
                    >
                        <FileText size={16} /> {t('project.tabs.resumes')}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${tabBadgeClass}`}>{files.length}</span>
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('team')}
                    className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'team')}`}
                >
                    <Briefcase size={16} /> {t('project.tabs.team')}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${tabBadgeClass}`}>{project.members.length}</span>
                </button>

                {/* 
                <button
                    onClick={() => setActiveTab('discussions')}
                    className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'discussions')}`}
                >
                    <MessageSquare size={16} /> {t('project.tabs.discussions')}
                </button>
                */}
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-visible relative min-h-0">
                {activeTab === 'overview' && canViewOverview && (
                    <OverviewTab
                        analytics={analytics}
                        project={project}
                        files={files}
                        topCandidates={topCandidates}
                        contributionData={contributionData}
                        handleExport={handleExport}
                        currentUser={currentUser}
                    />
                )}

                {activeTab === 'activity' && canViewActivityTab && (
                    <ActivityTab
                        project={project}
                        riskCount={analytics.riskCount}
                        contributionData={contributionData}
                        canUseAntiGhosting={canUseAntiGhosting}
                        onMarkContacted={handleMarkContacted}
                        onMarkViewed={markViewed}
                        onMarkExported={markExported}
                        onBatchUpdate={handleBatchUpdate}
                        currentUser={currentUser}
                    />
                )}

                {activeTab === 'resumes' && canViewResumes && (
                    <ResumesTab
                        projectId={projectId}
                        files={files}
                        members={project.members}
                        isUploading={isUploading}
                        handleFilesAdded={handleFilesAdded}
                        onScan={handleStartScan}
                        onRemoveFile={removeFile}
                        onRetryFile={retryFile}
                        isReadOnly={!canScan}
                        checkProjectStatus={() => setIsProjectLockedModalOpen(true)}
                        canUseAntiGhosting={canUseAntiGhosting}
                        onMarkContacted={handleMarkContacted}
                        onMarkViewed={markViewed}
                        onMarkExported={markExported}
                        onBatchUpdate={handleBatchUpdate}
                        currentUser={currentUser}
                    />
                )}

                {activeTab === 'team' && (
                    <TeamTab
                        project={project}
                        currentUser={currentUser}
                        isAdmin={isAdmin}
                        isProjectOwner={isProjectOwner}
                        canManageTeam={canManageTeam}
                        onAddMember={(role) => {
                            if (canInviteMembers) {
                                setAddMemberType(role as any);
                            } else {
                                setIsProjectLockedModalOpen(true);
                            }
                        }}
                        removeMember={removeMember}
                        updateMember={updateMember}
                        updateProject={updateProject}
                        isActionLoading={isActionLoading}
                    />
                )}

                {/* 
                {activeTab === 'discussions' && (
                    <DiscussionsTab
                        project={project}
                        currentUser={currentUser}
                        canAccessAdminChannel={canAccessAdminChannel}
                        isReadOnly={!canChat}
                    />
                )}
                */}
            </div>

            {/* ... (Modals) ... */}
            <AddMemberModal
                project={project}
                currentUser={currentUser}
                addMemberType={addMemberType}
                onClose={() => setAddMemberType(null)}
                addMember={addMember}
                isActionLoading={isActionLoading}
            />

            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={project}
                currentUser={currentUser}
                onSave={saveProjectChanges}
                onUserUpdate={onUpdateUser}
                onNavigate={onNavigate}
                fundProject={async (params) => fundProject(params.amount)}
                withdrawProjectFunds={async (params) => withdrawFunds(params.amount)}
            />

            <UpgradePlanModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onUpgrade={() => {
                    setIsUpgradeModalOpen(false);
                    onNavigate('upgrade-plan');
                }}
            />

            <NoScansModal
                isOpen={isNoScansModalOpen}
                onClose={() => setIsNoScansModalOpen(false)}
                onNotifyOwner={() => notifyOwner(project.ownerId, currentUser.id)}
                ownerName={projectOwner?.displayName || 'Project Owner'}
            />

            <QuotaExceededModal
                isOpen={isQuotaExceededModalOpen}
                onClose={() => setIsQuotaExceededModalOpen(false)}
                quota={typeof currentMemberQuota === 'number' ? currentMemberQuota : 0}
                used={currentMemberUsed || 0}
            />

            <OwnerBannedModal
                isOpen={isOwnerBannedModalOpen}
                onClose={() => {
                    // Cannot close without navigating away
                    onNavigate('projects');
                }}
                ownerName={projectOwner?.displayName || 'Project Owner'}
            />

            <ProjectLockedModal
                isOpen={isProjectLockedModalOpen}
                onClose={() => setIsProjectLockedModalOpen(false)}
                status={project.status === 'ARCHIVED' ? 'ARCHIVED' : 'COMPLETED'}
            />
        </div>
    );
};

export default ProjectDetail;
