
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOCK_PROJECTS, updateProject, getProjectAnalytics, generateReport, getUser, notifyOwner, processScanTransaction, markCandidateContacted, updateMemberPreferredEmail } from '../services/mockData';
import { 
  ArrowLeft, Edit2, Clock, BarChart2, FileText, Briefcase, MessageSquare, ChevronUp, ChevronDown, Zap, AlertTriangle, Coins, Activity, AtSign, Check, Link, Mail, Shield
} from 'lucide-react';
import { ProjectFile, Project, ProjectRole, User as UserType, BillingType, FileId, UserId, OutreachStrategy } from '../types';
import { useFileProcessing } from '../hooks/useFileProcessing'; // Import new hook

// Tab Components
import OverviewTab from './project-tabs/OverviewTab';
import ResumesTab from './project-tabs/ResumesTab';
import TeamTab from './project-tabs/TeamTab';
import DiscussionsTab from './project-tabs/DiscussionsTab';
import ActivityTab from './project-tabs/ActivityTab';

// Modal Components
import AddMemberModal from '../components/modals/AddMemberModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import UpgradePlanModal from '../components/modals/UpgradePlanModal';
import NoScansModal from '../components/modals/NoScansModal';
import OwnerBannedModal from '../components/modals/OwnerBannedModal';
import ProjectLockedModal from '../components/modals/ProjectLockedModal';
import LowCreditsBanner from '../components/LowCreditsBanner';
import ProjectBudgetBanner from '../components/ProjectBudgetBanner';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  deductScans: (amount: number, ownerId?: string) => boolean;
  currentUser: UserType;
  onNavigate: (page: string) => void;
  onUpdateUser?: (user: UserType) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, deductScans, currentUser, onNavigate, onUpdateUser }) => {
  const [project, setProject] = useState<Project | undefined>(() => {
      const p = MOCK_PROJECTS.find(pr => pr.id === projectId);
      return p ? { ...p, members: [...p.members] } : undefined;
  });
  
  const [isIdentitySelectorOpen, setIsIdentitySelectorOpen] = useState(false);

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

  // --- USE NEW FILE PROCESSING HOOK ---
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
  
  const [addMemberType, setAddMemberType] = useState<'ADMIN' | 'EMPLOYEE' | 'VISITOR' | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNoScansModalOpen, setIsNoScansModalOpen] = useState(false);
  const [isOwnerBannedModalOpen, setIsOwnerBannedModalOpen] = useState(false);
  const [isProjectLockedModalOpen, setIsProjectLockedModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const [quotaError, setQuotaError] = useState<string | null>(null);

  // Theme Helpers
  const theme = currentUser.preferences?.uiConfig?.theme || 'DARK';
  const isLight = theme === 'LIGHT';
  const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';

  // --- CHECK OWNER STATUS PERIODICALLY ---
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

  // Click outside to close identity selector
  useEffect(() => {
      if (isIdentitySelectorOpen) {
          const handleClickOutside = () => setIsIdentitySelectorOpen(false);
          document.addEventListener('click', handleClickOutside);
          return () => document.removeEventListener('click', handleClickOutside);
      }
  }, [isIdentitySelectorOpen]);

  if (!project) return <div>Project not found</div>;

  const projectOwner = getUser(project.ownerId);
  const ownerScans = projectOwner ? projectOwner.scansBalance : 0;
  
  const isInvestmentMode = project.settings.billingMode === 'PROJECT_INVESTMENT';
  const displayBalance = isInvestmentMode ? project.investmentBalance : ownerScans;

  const currentMemberRecord = project.members.find(m => m.userId === currentUser.id);
  const currentUserRole = currentMemberRecord?.role;
  const currentPermissions = currentMemberRecord?.permissions || [];
  
  const isProjectOwner = currentUser.id === project.ownerId;
  const isAdmin = currentUserRole === ProjectRole.ADMIN;
  const isAnalyst = !isAdmin && !isProjectOwner && currentPermissions.includes('ANALYZE') && !currentPermissions.includes('SCAN');
  const isScout = !isAdmin && !isProjectOwner && currentPermissions.includes('SCAN') && !currentPermissions.includes('ANALYZE');
  
  const isActive = project.status === 'ACTIVE';
  const isArchived = project.status === 'ARCHIVED';
  const isCompleted = project.status === 'COMPLETED';

  const canManageTeam = !isCompleted && (isActive || (isArchived && (isProjectOwner || isAdmin)));
  const canChat = !isCompleted && (isActive || (isArchived && (isProjectOwner || isAdmin)));
  const canScan = isActive; 
  const canEditProject = isProjectOwner || isAdmin; 

  const canViewOverview = isProjectOwner || isAdmin || currentPermissions.includes('ANALYZE');
  const canViewResumes = isProjectOwner || isAdmin || currentPermissions.includes('SCAN');
  const canAccessAdminChannel = isProjectOwner || isAdmin;

  const canViewActivityTab = isProjectOwner || isAdmin || (isAnalyst && project.settings.analystCanViewActivity);
  
  const canUseAntiGhosting = isProjectOwner || isAdmin || 
                             (isAnalyst && project.settings.analystCanUseGhosting) || 
                             (isScout && project.settings.scoutCanUseGhosting);

  const analytics = useMemo(() => getProjectAnalytics(projectId), [files, project.members, projectId]);
  
  const contributionData = useMemo(() => project.members.map(m => {
        return { scans: m.scansUsed, role: m.role }; 
  }), [project.members]);
  
  const topCandidates = useMemo(() => files
      .filter(f => f.score && f.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5), [files]);

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

  const handleBatchUpdate = (updates: {id: string, changes: Partial<ProjectFile>}[]) => {
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
      if (!canScan) {
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

  // Identity Logic for Header
  const isCentralized = project.settings.outreachStrategy === OutreachStrategy.OWNER_IDENTITY;
  const showIdentitySelector = canUseAntiGhosting && !isCentralized;
  const showCentralizedBadge = canUseAntiGhosting && isCentralized;
  
  const currentIdentityId = currentMemberRecord?.preferredOutreachEmailId;
  const activeEmail = currentUser.emailIntegrations.find(e => e.id === currentIdentityId);

  // If centralized, fetch owner email
  let centralizedEmailAddress = '...';
  if (isCentralized && project.settings.ownerOutreachEmailId) {
      // In a real app we might not have ownerUser fully loaded if we aren't owner/admin, 
      // but mockData getUser() works synchronously.
      const ownerUser = getUser(project.ownerId);
      const emailObj = ownerUser?.emailIntegrations.find(e => e.id === project.settings.ownerOutreachEmailId);
      if (emailObj) centralizedEmailAddress = emailObj.emailAddress;
  }

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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        project.status === 'ACTIVE' 
                        ? `bg-${accentColor}-500/10 text-${accentColor}-500 border-${accentColor}-500/20` 
                        : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                        {project.status}
                    </span>
                </div>
                
                <div className="relative mt-1">
                    <p 
                        className={`max-w-2xl text-sm leading-relaxed transition-all duration-300 ${descClass} ${isDescriptionExpanded ? '' : 'line-clamp-1'}`}
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
                            {isDescriptionExpanded ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                        </button>
                    )}
                </div>

                <div className={`flex flex-wrap items-center gap-4 mt-2 text-xs font-medium ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} /> Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    
                    {isInvestmentMode ? (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${displayBalance === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            <Coins size={10} className="fill-current" /> 
                            Budget: {displayBalance}
                        </div>
                    ) : (
                        projectOwner && (
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${displayBalance < 0 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : `bg-${accentColor}-500/10 text-${accentColor}-500 border-${accentColor}-500/20`}`}>
                                <Zap size={10} className="fill-current" /> 
                                {displayBalance < 0 ? `Overage: ${displayBalance}` : `Balance: ${displayBalance}`}
                            </div>
                        )
                    )}

                    {/* Sender Identity Display (Fixed if Centralized) */}
                    {showCentralizedBadge && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border cursor-default ${
                            isLight 
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
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all ${
                                    activeEmail 
                                    ? (isLight ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20')
                                    : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-zinc-400 border-white/10')
                                }`}
                            >
                                <AtSign size={10} />
                                {activeEmail ? <span className="truncate max-w-[150px]">{activeEmail.emailAddress}</span> : 'Select Sending Email'}
                                <ChevronDown size={10} />
                            </button>

                            {isIdentitySelectorOpen && (
                                <div onClick={e => e.stopPropagation()} className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl border z-50 overflow-hidden animate-fade-in-up p-2 ${isLight ? 'bg-white border-slate-100' : 'bg-[#18181b] border-white/10'}`}>
                                    <div className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Sending as:</div>
                                    <div className="space-y-1">
                                        {currentUser.emailIntegrations.length > 0 ? (
                                            currentUser.emailIntegrations.map(email => (
                                                <button
                                                    key={email.id}
                                                    onClick={() => handleIdentityChange(email.id)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                                                        currentIdentityId === email.id
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
                                                <p className={`text-xs mb-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>No emails connected.</p>
                                                <button 
                                                    onClick={() => onNavigate('profile')} 
                                                    className={`text-xs font-bold flex items-center justify-center gap-1 w-full py-1.5 rounded bg-${accentColor}-600 text-white hover:bg-${accentColor}-500`}
                                                >
                                                    <Link size={10} /> Connect Email
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
                    <Edit2 size={14} /> Edit Project
                </button>
            )}
        </div>
      </div>

      <LowCreditsBanner balance={ownerScans} onBuy={() => onNavigate('buy-scans')} />
      {isInvestmentMode && isProjectOwner && (
          <ProjectBudgetBanner 
              project={project} 
              ownerBalance={ownerScans}
              onFundProject={() => setIsEditModalOpen(true)}
              onBuyCredits={() => onNavigate('buy-scans')}
          />
      )}
      {quotaError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-between text-red-400 text-sm animate-fade-in">
              <div className="flex items-center gap-2">
                  <AlertTriangle size={16} /> 
                  <span className="font-bold">Scan Failed:</span> {quotaError}
              </div>
              <button onClick={() => setQuotaError(null)} className="text-red-400 hover:text-white">Dismiss</button>
          </div>
      )}

      {/* --- TABS --- */}
      <div className={`border-b mb-6 flex gap-6 shrink-0 overflow-x-auto no-scrollbar ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
          {canViewOverview && (
              <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'overview')}`}
              >
                  <BarChart2 size={16} /> Overview
              </button>
          )}
          
          {canViewActivityTab && (
              <button 
                onClick={() => setActiveTab('activity')}
                className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'activity')}`}
              >
                  <Activity size={16} /> Activity & Audit
              </button>
          )}

          {canViewResumes && (
              <button 
                onClick={() => setActiveTab('resumes')}
                className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'resumes')}`}
              >
                  <FileText size={16} /> Resumes
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${tabBadgeClass}`}>{files.length}</span>
              </button>
          )}

          <button 
            onClick={() => setActiveTab('team')}
            className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'team')}`}
          >
              <Briefcase size={16} /> Team
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${tabBadgeClass}`}>{project.members.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('discussions')}
            className={`pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${tabClass(activeTab === 'discussions')}`}
          >
              <MessageSquare size={16} /> Discussions
          </button>
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
                  files={files}
                  project={project}
                  canUseAntiGhosting={canUseAntiGhosting}
                  onMarkContacted={handleMarkContacted}
                  onBatchUpdate={handleBatchUpdate}
                  currentUser={currentUser}
              />
          )}

          {activeTab === 'resumes' && canViewResumes && (
              <ResumesTab 
                  files={files}
                  isUploading={isUploading}
                  handleFilesAdded={handleFilesAdded}
                  onScan={handleStartScan}
                  onRemoveFile={removeFile}
                  onRetryFile={retryFile}
                  isReadOnly={!canScan}
                  checkProjectStatus={() => setIsProjectLockedModalOpen(true)}
                  canUseAntiGhosting={canUseAntiGhosting}
                  onMarkContacted={handleMarkContacted}
                  currentUser={currentUser}
              />
          )}

          {activeTab === 'team' && (
              <TeamTab 
                  project={project} 
                  currentUser={currentUser} 
                  setProject={setProject}
                  onOpenAddModal={(type) => {
                      if (canManageTeam) {
                          setAddMemberType(type);
                      } else {
                          setIsProjectLockedModalOpen(true);
                      }
                  }}
                  isReadOnly={!canManageTeam}
                  checkProjectStatus={() => setIsProjectLockedModalOpen(true)}
              />
          )}

          {activeTab === 'discussions' && (
              <DiscussionsTab 
                  projectId={project.id}
                  currentUser={currentUser}
                  canAccessAdminChannel={canAccessAdminChannel}
                  isReadOnly={!canChat}
              />
          )}
      </div>

      {/* ... (Modals) ... */}
      <AddMemberModal 
        project={project} 
        currentUser={currentUser} 
        addMemberType={addMemberType} 
        onClose={() => setAddMemberType(null)} 
        setProject={setProject}
      />

      <EditProjectModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
        currentUser={currentUser}
        onSave={saveProjectChanges}
        onUserUpdate={onUpdateUser}
        onNavigate={onNavigate}
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
