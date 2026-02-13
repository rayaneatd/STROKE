
import React from 'react';
import { MOCK_USERS } from '../services/mockData';
import {
    Plus, Search, MoreHorizontal, Users, FileText, X, Filter,
    Calendar, Archive, CheckCircle, LayoutGrid, List, Crown,
    Edit2, Trash2, LogOut, Rocket, RotateCcw, Power, ChevronDown
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { Project, User, ProjectRole } from '../types';
import LowCreditsBanner from '../components/LowCreditsBanner';

// Modals
import ProjectModal from '../components/modals/EditProjectModal'; // Unified modal for Edit/Create
import LeaveProjectModal from '../components/modals/LeaveProjectModal';
import DeleteProjectModal from '../components/modals/DeleteProjectModal';

// --- MEMOIZED COMPONENTS ---

const ProjectCard = React.memo(({
    project,
    currentUser,
    viewMode,
    density,
    isMenuOpen,
    onProjectClick,
    onMenuToggle,
    onEdit,
    onStatusChange,
    onLeave,
    onDelete,
    isLight,
    accentColor
}: {
    project: Project;
    currentUser: User;
    viewMode: 'grid' | 'list';
    density: 'COMFORTABLE' | 'COMPACT';
    isMenuOpen: boolean;
    onProjectClick: (id: string) => void;
    onMenuToggle: (e: React.MouseEvent, id: string) => void;
    onEdit: (e: React.MouseEvent, project: Project, role: ProjectRole) => void;
    onStatusChange: (e: React.MouseEvent, project: Project, newStatus: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED') => void;
    onLeave: (e: React.MouseEvent, project: Project) => void;
    onDelete: (e: React.MouseEvent, project: Project) => void;
    isLight: boolean;
    accentColor: string;
}) => {
    const member = project.members.find(m => m.userId === currentUser.id);
    const userRole = member?.role || ProjectRole.EMPLOYEE;
    const owner = MOCK_USERS.find(u => u.id === project.ownerId);

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'ACTIVE': return `bg-${accentColor}-500/10 text-${accentColor}-500 border-${accentColor}-500/20`;
            case 'ARCHIVED': return isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700';
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return isLight ? 'bg-slate-100 text-slate-500' : 'bg-zinc-800 text-zinc-500';
        }
    };

    const isCompact = density === 'COMPACT';
    const isOwner = userRole === ProjectRole.OWNER;
    const isAdmin = userRole === ProjectRole.ADMIN;

    const canEdit = isOwner || isAdmin;
    const canDelete = isOwner;
    const canLeave = !isOwner;

    const hasStatusPermission = isOwner || (isAdmin && project.settings.adminCanChangeStatus);

    const showReactivate = project.status !== 'ACTIVE' && hasStatusPermission;
    const showArchive = project.status !== 'ARCHIVED' && hasStatusPermission;
    const showComplete = project.status !== 'COMPLETED' && hasStatusPermission;

    // Light mode: Physical card feel (white bg, shadow)
    // Dark mode: Flat glass feel
    const cardBg = isLight
        ? 'bg-white border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1'
        : 'bg-[#0e0e10] border-white/5 shadow-sm hover:shadow-lg hover:border-white/10 hover:-translate-y-0.5';

    const textColor = isLight ? 'text-slate-800' : 'text-zinc-100';
    const subTextColor = isLight ? 'text-slate-500' : 'text-zinc-500';
    const mutedTextColor = isLight ? 'text-slate-400' : 'text-zinc-600';

    // Grid View
    if (viewMode === 'grid') {
        return (
            <div
                onClick={() => onProjectClick(project.id)}
                className={`group rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col ${cardBg} ${isCompact ? 'p-4' : 'p-6'} ${project.status !== 'ACTIVE' ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
            >
                {/* Accent line on hover */}
                <div className={`absolute top-0 left-0 w-1 h-full bg-${accentColor}-500 opacity-0 group-hover:opacity-100 transition-opacity ${project.status !== 'ACTIVE' ? 'bg-zinc-500' : ''}`} />

                <div className={`flex justify-between items-start ${isCompact ? 'mb-2' : 'mb-4'}`}>
                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${getStatusColor(project.status)}`}>
                        {project.status === 'COMPLETED' && <CheckCircle size={10} />}
                        {project.status === 'ARCHIVED' && <Archive size={10} />}
                        {project.status}
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => onMenuToggle(e, project.id)}
                            className={`p-1.5 rounded-lg transition-colors relative z-10 ${isMenuOpen ? (isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white') : (isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {isMenuOpen && (
                            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border z-50 overflow-hidden animate-fade-in-up ${isLight ? 'bg-white border-slate-100 shadow-slate-200/50' : 'bg-[#18181b] border-white/10'}`} onClick={(e) => e.stopPropagation()}>
                                {showReactivate && (
                                    <button onClick={(e) => onStatusChange(e, project, 'ACTIVE')} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                        <RotateCcw size={14} /> Reactivate
                                    </button>
                                )}
                                {showComplete && (
                                    <button onClick={(e) => onStatusChange(e, project, 'COMPLETED')} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                        <CheckCircle size={14} /> Mark Completed
                                    </button>
                                )}
                                {showArchive && (
                                    <button onClick={(e) => onStatusChange(e, project, 'ARCHIVED')} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                        <Archive size={14} /> Archive
                                    </button>
                                )}
                                {canEdit && (
                                    <button onClick={(e) => onEdit(e, project, userRole)} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                        <Edit2 size={14} /> Edit Details
                                    </button>
                                )}
                                {canLeave && (
                                    <button onClick={(e) => onLeave(e, project)} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                        <LogOut size={14} /> Leave Project
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={(e) => onDelete(e, project)} className={`w-full text-left px-4 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                        <Trash2 size={14} /> Delete Project
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <h3 className={`font-bold group-hover:text-${accentColor}-500 transition-colors ${textColor} ${isCompact ? 'text-sm mb-1' : 'text-lg mb-2'}`}>{project.title}</h3>

                <div className={`flex items-center gap-1.5 text-[10px] ${subTextColor} ${isCompact ? 'mb-2' : 'mb-3'}`}>
                    <Crown size={12} className="text-amber-500 fill-current" />
                    <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>{owner?.displayName || 'Unknown'}</span>
                </div>

                <p className={`${subTextColor} text-xs leading-relaxed line-clamp-2 h-9 flex-1 ${isCompact ? 'mb-3' : 'mb-6'}`}>
                    {project.description}
                </p>

                <div className={`flex items-center justify-between border-t mt-auto ${isLight ? 'border-slate-100' : 'border-white/5'} ${isCompact ? 'pt-3' : 'pt-4'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-1.5 ${subTextColor}`}>
                            <FileText size={14} />
                            <span className="text-xs font-bold">{project.fileCount}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${subTextColor}`}>
                            <Users size={14} />
                            <span className="text-xs font-bold">{project.memberCount}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div
            onClick={() => onProjectClick(project.id)}
            className={`group rounded-xl border hover:shadow-md transition-all cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative ${cardBg} ${isCompact ? 'p-2.5' : 'p-4'} ${project.status !== 'ACTIVE' ? 'opacity-60' : ''}`}
        >
            <div className="col-span-1 md:col-span-4 min-w-0">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg hidden sm:block ${isLight ? `bg-${accentColor}-50 text-${accentColor}-600 border border-${accentColor}-100` : `bg-white/5 text-${accentColor}-400`}`}>
                        <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                        <h3 className={`font-bold text-sm truncate group-hover:text-${accentColor}-500 transition-colors ${textColor}`}>{project.title}</h3>
                        <p className={`text-xs truncate ${subTextColor}`}>{project.description}</p>
                    </div>
                </div>
            </div>

            <div className="col-span-1 md:col-span-2">
                <div className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${getStatusColor(project.status)}`}>
                    {project.status === 'COMPLETED' && <CheckCircle size={10} />}
                    {project.status === 'ARCHIVED' && <Archive size={10} />}
                    {project.status}
                </div>
            </div>

            <div className="col-span-1 md:col-span-2">
                <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    <Crown size={12} className="text-amber-500 fill-current" />
                    <span className="truncate font-medium">{owner?.displayName || 'Unknown'}</span>
                </div>
            </div>

            <div className={`col-span-1 md:col-span-2 flex items-center gap-4 ${subTextColor}`}>
                <div className="flex items-center gap-1.5">
                    <FileText size={14} />
                    <span className="text-xs font-bold">{project.fileCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    <span className="text-xs font-bold">{project.memberCount}</span>
                </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-4 relative">
                <span className={`text-xs font-medium mr-2 ${subTextColor}`}>{new Date(project.createdAt).toLocaleDateString()}</span>
                {/* Menu Trigger reused */}
                <div className="relative">
                    <button
                        onClick={(e) => onMenuToggle(e, project.id)}
                        className={`p-1.5 rounded-md transition-colors relative z-10 ${isMenuOpen ? (isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white') : (isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    {isMenuOpen && (
                        <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border z-50 overflow-hidden animate-fade-in-up ${isLight ? 'bg-white border-slate-100 shadow-slate-200/50' : 'bg-[#18181b] border-white/10'}`} onClick={(e) => e.stopPropagation()}>
                            {showReactivate && (
                                <button onClick={(e) => onStatusChange(e, project, 'ACTIVE')} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                    <RotateCcw size={14} /> Reactivate
                                </button>
                            )}
                            {showComplete && (
                                <button onClick={(e) => onStatusChange(e, project, 'COMPLETED')} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                    <CheckCircle size={14} /> Mark Completed
                                </button>
                            )}
                            {showArchive && (
                                <button onClick={(e) => onStatusChange(e, project, 'ARCHIVED')} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                    <Archive size={14} /> Archive
                                </button>
                            )}
                            {canEdit && (
                                <button onClick={(e) => onEdit(e, project, userRole)} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                    <Edit2 size={14} /> Edit Details
                                </button>
                            )}
                            {canLeave && (
                                <button onClick={(e) => onLeave(e, project)} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                    <LogOut size={14} /> Leave Project
                                </button>
                            )}
                            {canDelete && (
                                <button onClick={(e) => onDelete(e, project)} className={`w-full text-left px-4 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                    <Trash2 size={14} /> Delete Project
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const PROJECTS_PER_PAGE = 12;

interface ProjectsProps {
    onProjectClick: (projectId: string) => void;
    currentUser: User;
    onNavigate: (page: string) => void;
    onUpdateUser?: (user: User) => void;
}

const Projects: React.FC<ProjectsProps> = ({ onProjectClick, currentUser, onNavigate, onUpdateUser }) => {
    const {
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
    } = useProjects({ currentUser, onUpdateUser, onNavigate });

    // Theme & Density
    const theme = currentUser.preferences?.uiConfig?.theme || 'DARK';
    const isLight = theme === 'LIGHT';
    const density = currentUser.preferences?.uiConfig?.density || 'COMFORTABLE';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';

    const selectClass = isLight
        ? 'bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-slate-100'
        : 'bg-[#18181b] border-white/10 text-zinc-300 focus:ring-2 focus:ring-white/5';

    // Dual Identity Constraint
    const canCreateProject = currentUser.isOwner || !!currentUser.primaryEmail;

    return (
        <div className="space-y-6 animate-fade-in relative">
            <LowCreditsBanner balance={currentUser.scansBalance} onBuy={() => onNavigate('buy-scans')} />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Projects</h1>
                    <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Manage your recruitment missions</p>
                </div>
                <div className="flex items-center gap-2">
                    {!canCreateProject && (
                        <span className="text-xs text-red-500 font-bold hidden md:inline-block">
                            Add Primary Email to create projects
                        </span>
                    )}
                    <button
                        onClick={canCreateProject ? handleCreateClick : undefined}
                        disabled={!canCreateProject}
                        title={!canCreateProject ? "Please add a primary email in Settings > Security" : "Create New Project"}
                        className={`bg-${accentColor}-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-${accentColor}-500 transition-colors flex items-center gap-2 shadow-lg shadow-${accentColor}-900/20 active:translate-y-0.5 hover:-translate-y-0.5 ${!canCreateProject ? 'opacity-50 cursor-not-allowed saturate-0' : ''}`}
                    >
                        <Plus size={16} />
                        Create Project
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={`p-2 rounded-xl border flex flex-col xl:flex-row gap-4 xl:items-center justify-between ${isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-white/5 border-white/5'}`}>
                <div className="flex flex-col lg:flex-row gap-2 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className={`pl-9 pr-8 py-2 rounded-lg text-sm font-medium outline-none w-full border transition-all ${isLight ? 'bg-slate-50 border-slate-100 text-slate-800 focus:bg-white focus:border-slate-300 placeholder:text-slate-400' : 'bg-white/5 border-white/5 text-zinc-300 focus:bg-black/20 focus:border-white/10 placeholder:text-zinc-600'}`}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className={`w-px h-4 hidden lg:block self-center ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                    {/* Dropdowns */}
                    <div className="flex flex-wrap gap-2">
                        <div className="relative group">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className={`pl-3 pr-8 py-2 text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg border transition-colors ${selectClass}`}
                            >
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ALL">All Status</option>
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ACTIVE">Active</option>
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="COMPLETED">Completed</option>
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ARCHIVED">Archived</option>
                            </select>
                            <ChevronDown size={14} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                        </div>

                        <div className="relative group">
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value as any)}
                                className={`pl-3 pr-8 py-2 text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg border transition-colors ${selectClass}`}
                            >
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ALL">Any Time</option>
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="LAST_7">Last 7 Days</option>
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="LAST_30">Last 30 Days</option>
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="LAST_90">Last 3 Months</option>
                            </select>
                            <ChevronDown size={14} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                        </div>

                        <div className="relative group">
                            <select
                                value={ownerFilter}
                                onChange={(e) => setOwnerFilter(e.target.value as any)}
                                className={`pl-3 pr-8 py-2 text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg border transition-colors ${selectClass}`}
                            >
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ALL">All Owners</option>
                                <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ME">My Projects</option>
                            </select>
                            <ChevronDown size={14} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                        </div>

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className={`px-3 py-2 text-xs font-bold text-${accentColor}-500 hover:text-${accentColor}-600 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* View Toggle */}
                <div className={`flex items-center gap-1 p-1 rounded-lg self-start lg:self-center border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-zinc-300')}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-zinc-300')}`}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0e0e10] border-white/5'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-white/5 text-zinc-500'}`}>
                        <Filter size={24} />
                    </div>
                    <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-zinc-300'}`}>No projects found</h3>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                        {projects.length === 0 ? "You don't have any projects yet." : "No projects match your current filters."}
                    </p>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={resetFilters}
                            className={`mt-4 text-${accentColor}-500 text-xs font-bold hover:underline`}
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                        {viewMode === 'list' && (
                            <div className={`hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                                <div className="col-span-4">Project</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2">Owner</div>
                                <div className="col-span-2">Stats</div>
                                <div className="col-span-2 text-right">Created</div>
                            </div>
                        )}

                        {visibleProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                currentUser={currentUser}
                                viewMode={viewMode}
                                density={density}
                                isMenuOpen={activeMenuId === project.id}
                                onProjectClick={onProjectClick}
                                onMenuToggle={handleMenuClick}
                                onEdit={handleEditProject}
                                onStatusChange={handleStatusChange}
                                onLeave={handleLeaveProject}
                                onDelete={handleDeleteProject}
                                isLight={isLight}
                                accentColor={accentColor}
                            />
                        ))}
                    </div>

                    {filteredProjects.length > displayCount && (
                        <div className="flex justify-center pt-8 pb-4">
                            <button
                                onClick={handleLoadMore}
                                className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border ${isLight ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm' : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border-white/5'}`}
                            >
                                Load More ({filteredProjects.length - displayCount} remaining)
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Unified Project Modal (Handles Both Create and Edit) */}
            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                project={editingProject} // If undefined, it acts as Create Mode
                currentUser={currentUser}
                onSave={handleProjectModalSave}
                onUserUpdate={onUpdateUser}
                onNavigate={onNavigate}
            />

            <LeaveProjectModal
                isOpen={!!projectToLeave}
                onClose={() => setProjectToLeave(null)}
                projectTitle={projectToLeave?.title || ''}
                onConfirm={confirmLeaveProject}
            />

            <DeleteProjectModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                projectTitle={projectToDelete?.title || ''}
                onConfirm={confirmDeleteProject}
            />
        </div>
    );
};

export default Projects;
