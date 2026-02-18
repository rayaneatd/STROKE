import React, { useState, useMemo, useEffect } from 'react';
import { ProjectFile, User, Project, ProjectRole } from '../../types';
import { debounce } from '../../utils/performance';
import { generateAIEmailDraft, generateReport } from '../../services/mockData';
import { useCandidates } from '../../hooks/useCandidates';
import {
    Activity, Calendar, Clock, Download, FileText, Filter, Ghost,
    Loader2, Search, Send, User as UserIcon, Wand2, MailCheck,
    SortAsc, SortDesc, Check, X,
    Crown, Medal, Award, Trophy,
    FileEdit, FileCheck, Eye, EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '../../hooks/useVirtualizer';
import CandidateDrawer from '../../components/CandidateDrawer';

interface ActivityTabProps {
    project: Project;
    riskCount: number;
    contributionData: { userId: string; scans: number }[];
    canUseAntiGhosting: boolean;
    onMarkContacted?: (fileId: string) => void;
    onMarkViewed?: (fileId: string) => void;
    onMarkExported?: (fileId: string) => void;
    onBatchUpdate?: (updates: { id: string, changes: Partial<ProjectFile> }[]) => void;
    currentUser: User;
}

type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'SCORE_DESC' | 'SCORE_ASC';
type ScoreFilter = 'HIGH' | 'MID' | 'LOW';
type ActivityFilter = 'EMAILED' | 'NOT_EMAILED' | 'EXPORTED' | 'NOT_EXPORTED' | 'VIEWED' | 'NOT_VIEWED' | 'HAS_DRAFT';

const ITEM_HEIGHT = 72;
const CONTAINER_HEIGHT = 600;

const ActivityTab: React.FC<ActivityTabProps> = ({
    project,
    riskCount,
    contributionData,
    canUseAntiGhosting,
    onMarkContacted,
    onMarkViewed,
    onMarkExported,
    onBatchUpdate,
    currentUser
}) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [isDraftingAll, setIsDraftingAll] = useState(false);
    const [isSendingAll, setIsSendingAll] = useState(false);

    // --- Filter & Sort State (Multi-Select) ---
    const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');
    const [filterScanners, setFilterScanners] = useState<string[]>([]);
    const [filterScores, setFilterScores] = useState<ScoreFilter[]>([]);
    const [filterActivities, setFilterActivities] = useState<ActivityFilter[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [scannerSearch, setScannerSearch] = useState('');

    // --- Drawer State ---
    const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Theme Helpers
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'slate';

    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const borderClass = isLight ? 'border-slate-100' : 'border-white/5';
    const itemHoverClass = isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-white/5 border-white/10 text-white placeholder:text-zinc-500';
    const selectBg = isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#18181b] border-white/10 text-zinc-300';
    
    // Map user IDs to User objects for quick lookup
    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        project.members.forEach(m => {
            if (m.user) map.set(m.userId, m.user);
        });
        return map;
    }, [project.members]);

    const availableScanners = useMemo(() => {
        // Since we don't have all files, we use project members as potential scanners
        return project.members
            .map(m => m.user)
            .filter((u): u is User => !!u);
    }, [project.members]);

    const activeFiltersCount = filterScanners.length + filterScores.length + filterActivities.length;
    const isFiltering = activeFiltersCount > 0 || search.length > 0;

    // --- Server-side Data Fetching ---
    const { 
        candidates: filteredFiles, 
        totalCount: totalScans, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading 
    } = useCandidates({
        projectId: project.id,
        userId: currentUser.id,
        searchQuery: search,
        sortOption,
        filterScores,
        filterActivities,
        filterUploaders: filterScanners,
        // Fetch all statuses including FAILED for activity log
        status: ['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED']
    });

    // STRICT At Risk Logic:
    // Defined as any candidate who has NOT been emailed.
    // NOTE: riskCount is now passed from parent (calculated via analytics)
    
    // FILTERED Risk Logic:
    // Uncontacted candidates strictly within the CURRENT filtered view (loaded pages)
    const filteredRiskCandidates = useMemo(() => filteredFiles.filter(f => !f.emailSentAt && f.status !== 'FAILED'), [filteredFiles]);

    // Sub-lists for actions (Scoped to FILTERED/LOADED list so buttons only act on what is visible)
    const candidatesWithDrafts = useMemo(() => filteredRiskCandidates.filter(f => !!f.emailDraft), [filteredRiskCandidates]);
    const candidatesNoDrafts = useMemo(() => filteredRiskCandidates.filter(f => !f.emailDraft), [filteredRiskCandidates]);

    // Counts for Display
    const filteredRiskCount = filteredRiskCandidates.length; // View Risk

    // --- Virtualization ---
    const { visibleItems, totalHeight, onScroll } = useVirtualizer({
        itemCount: filteredFiles.length,
        itemHeight: ITEM_HEIGHT,
        containerHeight: CONTAINER_HEIGHT,
    });

    // Infinite Scroll Handler
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        onScroll(e);
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    // --- Handlers ---

    const toggleFilter = <T,>(item: T, current: T[], setFn: React.Dispatch<React.SetStateAction<T[]>>) => {
        if (current.includes(item)) {
            setFn(current.filter(i => i !== item));
        } else {
            setFn([...current, item]);
        }
    };

    // Anti-Ghosting Check
    const canSendEmails = currentUser.nylasConnected && (currentUser.workMails?.length || 0) > 0;

    // STRICT STEP 1: Generate Drafts ONLY for candidates who DON'T have one.
    const handleGhostingKiller = () => {
        if (!canSendEmails) {
            alert(t('project.activity.errors.connectWorkEmail'));
            return;
        }

        if (candidatesNoDrafts.length === 0) return;
        setIsDraftingAll(true);

        setTimeout(() => {
            const updates: { id: string, changes: Partial<ProjectFile> }[] = [];

            // Iterate only candidates needing drafts
            candidatesNoDrafts.forEach(f => {
                const draft = generateAIEmailDraft(f.candidateName || 'Candidate', f.score || 0);
                updates.push({ id: f.id, changes: { emailDraft: draft } });
            });

            if (updates.length > 0 && onBatchUpdate) {
                onBatchUpdate(updates);
            }

            setIsDraftingAll(false);
        }, 1500);
    };

    // STRICT STEP 2: Send ONLY candidates who HAVE a draft.
    const handleSendBulk = () => {
        if (!canSendEmails) {
            alert(t('project.activity.errors.connectWorkEmail'));
            return;
        }

        if (candidatesWithDrafts.length === 0) return;
        setIsSendingAll(true);

        setTimeout(() => {
            const updates: { id: string, changes: Partial<ProjectFile> }[] = [];

            const now = new Date().toISOString();
            candidatesWithDrafts.forEach(f => {
                updates.push({
                    id: f.id,
                    changes: {
                        emailSentAt: now,
                        emailSentBy: currentUser.id,
                        lastContactedAt: now,
                        emailDraft: '' // Clear draft in DB
                    }
                });
            });

            if (updates.length > 0 && onBatchUpdate) {
                onBatchUpdate(updates);
            }
            setIsSendingAll(false);
        }, 1000);
    };

    const clearFilters = () => {
        setFilterScanners([]);
        setFilterScores([]);
        setFilterActivities([]);
        setSearch('');
        setScannerSearch('');
    };

    const handleExport = () => {
        const candidatesToExport = filteredFiles;
        if (candidatesToExport.length === 0) {
            alert(t('project.resumes.errors.noCandidatesExport'));
            return;
        }

        setIsExporting(true);
        setTimeout(() => {
            const url = generateReport('PDF', 'CANDIDATES_EXPORT');
            const a = document.createElement('a');
            a.href = url;
            a.download = `candidates_bulk_export_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            if (onMarkExported) {
                candidatesToExport.forEach(f => onMarkExported(f.id));
            }
            setIsExporting(false);
        }, 1500);
    };

    const handleCandidateClick = (file: ProjectFile) => {
        if (onMarkViewed) onMarkViewed(file.id);
        setSelectedFile(file);
    };

    useEffect(() => {
        const handleClickOutside = () => setIsFilterOpen(false);
        if (isFilterOpen) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isFilterOpen]);

    const rankMap = useMemo(() => {
        const map = new Map<string, number>();
        filteredFiles.forEach((f, idx) => {
            if (f.rank) map.set(f.id, f.rank);
            else if (sortOption === 'SCORE_DESC') map.set(f.id, idx + 1);
        });
        return map;
    }, [filteredFiles, sortOption]);

    const uniqueScanners = contributionData.length;

    const filteredScanners = availableScanners.filter(u =>
        u.displayName.toLowerCase().includes(scannerSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(scannerSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative min-h-[600px] flex flex-col">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${cardBg} p-4 rounded-2xl border transition-all shadow-sm flex items-center gap-4`}>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                        <Activity size={20} />
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${textPrimary}`}>{totalScans}</div>
                        <div className={`text-xs ${textSecondary} font-medium uppercase tracking-wide`}>Total Scans Logged</div>
                    </div>
                </div>
                <div className={`${cardBg} p-4 rounded-2xl border transition-all shadow-sm flex items-center gap-4`}>
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <UserIcon size={20} />
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${textPrimary}`}>{uniqueScanners}</div>
                        <div className={`text-xs ${textSecondary} font-medium uppercase tracking-wide`}>Active Scanners</div>
                    </div>
                </div>
                <div className={`${cardBg} p-4 rounded-2xl border transition-all shadow-sm flex items-center gap-4`}>
                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                        <Ghost size={20} />
                    </div>
                    <div>
                        <div className={`text-2xl font-bold flex items-baseline gap-2 ${textPrimary}`}>
                            {riskCount}
                            {isFiltering && (
                                <span className={`text-sm font-normal ${textSecondary}`}>
                                    ({filteredRiskCount} visible)
                                </span>
                            )}
                        </div>
                        <div className={`text-xs ${textSecondary} font-medium uppercase tracking-wide`}>At Risk (Uncontacted)</div>
                    </div>
                </div>
            </div>

            {/* Main List Container */}
            <div className={`${cardBg} rounded-2xl border shadow-sm flex-1 flex flex-col overflow-hidden`}>

                {/* Toolbar */}
                <div className={`p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 ${borderClass} ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}`}>
                    <div className="flex flex-1 gap-2 w-full">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                            <input
                                type="text"
                                placeholder="Search by candidate or scanner..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-${accentColor}-500 text-sm ${inputBg}`}
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative group min-w-[140px]">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className={`w-full pl-3 pr-8 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-${accentColor}-500 appearance-none cursor-pointer ${selectBg}`}
                            >
                                <option value="DATE_DESC" className={isLight ? "bg-white" : "bg-[#18181b]"}>Newest</option>
                                <option value="DATE_ASC" className={isLight ? "bg-white" : "bg-[#18181b]"}>Oldest</option>
                                <option value="SCORE_DESC" className={isLight ? "bg-white" : "bg-[#18181b]"}>Score (High)</option>
                                <option value="SCORE_ASC" className={isLight ? "bg-white" : "bg-[#18181b]"}>Score (Low)</option>
                            </select>
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${textSecondary}`}>
                                {sortOption.includes('ASC') ? <SortAsc size={14} /> : <SortDesc size={14} />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors ${activeFiltersCount > 0
                                    ? `bg-${accentColor}-500/10 border-${accentColor}-500/20 text-${accentColor}-500`
                                    : isLight ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                    }`}
                            >
                                <Filter size={14} /> Filter
                                {activeFiltersCount > 0 && (
                                    <span className={`bg-${accentColor}-600 text-white px-1.5 py-0.5 rounded-full text-[10px]`}>
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>

                            {/* Filter Dropdown Menu */}
                            {isFilterOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border z-30 animate-fade-in-up p-4 ${isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#18181b] border-white/10'}`}
                                >
                                    <div className="space-y-4">
                                        {/* Scanner Filter */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Scanner</label>
                                                {filterScanners.length > 0 && (
                                                    <span className={`text-[10px] bg-${accentColor}-500/10 text-${accentColor}-400 px-1.5 rounded-md font-bold`}>{filterScanners.length}</span>
                                                )}
                                            </div>

                                            <div className="relative mb-2">
                                                <Search size={12} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${textSecondary}`} />
                                                <input
                                                    type="text"
                                                    placeholder="Find user..."
                                                    value={scannerSearch}
                                                    onChange={(e) => setScannerSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-${accentColor}-500/50 transition-colors ${inputBg}`}
                                                />
                                            </div>

                                            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                {filteredScanners.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={(e) => { e.stopPropagation(); toggleFilter(u.id, filterScanners, setFilterScanners); }}
                                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between group transition-colors ${itemHoverClass}`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${filterScanners.includes(u.id) ? `bg-${accentColor}-500 border-${accentColor}-500` : isLight ? 'border-slate-300 group-hover:border-slate-400' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                                                                {filterScanners.includes(u.id) && <Check size={10} className="text-white" />}
                                                            </div>
                                                            <img src={u.avatarUrl} className={`w-5 h-5 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`} alt="" />
                                                            <span className={`truncate ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{u.displayName}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                                {filteredScanners.length === 0 && (
                                                    <div className={`text-xs p-2 text-center italic ${textSecondary}`}>No matching scanners</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score Filter */}
                                        <div>
                                            <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${textSecondary}`}>Score Range</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['HIGH', 'MID', 'LOW'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={(e) => { e.stopPropagation(); toggleFilter(opt as ScoreFilter, filterScores, setFilterScores); }}
                                                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${filterScores.includes(opt as ScoreFilter)
                                                            ? `bg-${accentColor}-600 text-white border-${accentColor}-600`
                                                            : isLight ? 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100' : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Activity Filter */}
                                        <div>
                                            <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${textSecondary}`}>Status</label>
                                            <div className="space-y-1">
                                                {[
                                                    { id: 'EMAILED', label: 'Emailed', icon: <MailCheck size={12} /> },
                                                    { id: 'NOT_EMAILED', label: 'Not Emailed', icon: <MailCheck size={12} className="opacity-50" /> },
                                                    { id: 'HAS_DRAFT', label: 'Draft Ready', icon: <FileEdit size={12} /> },
                                                    { id: 'EXPORTED', label: 'Exported', icon: <FileCheck size={12} /> },
                                                    { id: 'VIEWED', label: 'Viewed by Me', icon: <Eye size={12} /> },
                                                    { id: 'NOT_VIEWED', label: 'New (Unread)', icon: <EyeOff size={12} /> },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={(e) => { e.stopPropagation(); toggleFilter(opt.id as ActivityFilter, filterActivities, setFilterActivities); }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${itemHoverClass}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${filterActivities.includes(opt.id as ActivityFilter) ? `bg-${accentColor}-500 border-${accentColor}-500` : isLight ? 'border-slate-300' : 'border-zinc-700'}`}>
                                                            {filterActivities.includes(opt.id as ActivityFilter) && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <div className={`flex items-center gap-2 flex-1 ${textPrimary}`}>
                                                            {opt.icon}
                                                            {opt.label}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {(activeFiltersCount > 0 || search) && (
                                            <div className={`pt-2 border-t ${borderClass}`}>
                                                <button onClick={clearFilters} className="w-full py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-1">
                                                    <X size={12} /> Clear Filters
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'}`}
                        >
                            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Export
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className={`grid grid-cols-12 gap-4 px-6 py-3 border-b text-[10px] font-bold uppercase tracking-widest sticky top-0 z-10 ${isLight ? 'bg-white border-slate-100 text-slate-400' : 'bg-[#0e0e10] border-white/5 text-zinc-500'}`}>
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-4">Candidate / File</div>
                    <div className="col-span-3">Scanned By</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2 text-right">Score</div>
                </div>

                {/* List Content with Virtualization */}
                <div
                    className={`flex-1 overflow-y-auto custom-scrollbar min-h-[500px] ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}`}
                    onScroll={onScroll}
                    style={{ height: CONTAINER_HEIGHT, position: 'relative' }}
                >
                    {filteredFiles.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center h-64 ${textSecondary}`}>
                            <FileText size={48} className="opacity-20 mb-3" />
                            <p className="text-sm font-medium">No activity records found.</p>
                            {(activeFiltersCount > 0 || search) && (
                                <button onClick={clearFilters} className={`mt-2 text-xs font-bold text-${accentColor}-400 hover:underline`}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ height: totalHeight, position: 'relative' }}>
                            {visibleItems.map(({ index, offsetTop }) => {
                                    const file = filteredFiles[index];
                                    const scanner = userMap.get(file.uploadedByUserId || '');
                                    const score = file.score || 0;
                                    const rank = sortOption === 'SCORE_DESC' ? index + 1 : undefined;

                                    const isExported = file.exportedBy?.includes(currentUser.id);
                                    const isViewed = file.viewedBy?.includes(currentUser.id);
                                    const isEmailed = !!file.emailSentAt;
                                    const hasDraft = !!file.emailDraft;

                                    let rankDisplay: React.ReactNode = '-';
                                    if (rank !== undefined) {
                                        if (rank === 1) {
                                        rankDisplay = (
                                            <div className="relative flex items-center justify-center w-8 h-8 mx-auto">
                                                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-[2px]"></div>
                                                <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg border border-yellow-300/30">
                                                    <Crown size={14} className="text-white fill-white/20" />
                                                </div>
                                            </div>
                                        );
                                    } else if (rank === 2) {
                                        rankDisplay = (
                                            <div className="relative flex items-center justify-center w-8 h-8 mx-auto">
                                                <div className="relative w-full h-full bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center shadow-md border border-slate-300/30">
                                                    <Medal size={14} className="text-white fill-white/20" />
                                                </div>
                                            </div>
                                        );
                                    } else if (rank === 3) {
                                        rankDisplay = (
                                            <div className="relative flex items-center justify-center w-8 h-8 mx-auto">
                                                <div className="relative w-full h-full bg-gradient-to-br from-orange-400 to-amber-700 rounded-full flex items-center justify-center shadow-md border border-orange-300/30">
                                                    <Award size={14} className="text-white fill-white/20" />
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        rankDisplay = <span className={`font-mono font-bold ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>#{rank}</span>;
                                    }
                                }

                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => handleCandidateClick(file)}
                                        style={{
                                            position: 'absolute',
                                            top: offsetTop,
                                            left: 0,
                                            width: '100%',
                                            height: ITEM_HEIGHT
                                        }}
                                        className={`grid grid-cols-12 gap-4 px-6 items-center transition-colors group cursor-pointer border-b ${isLight ? 'border-slate-50 hover:bg-slate-50' : 'border-white/5 hover:bg-white/5'}`}
                                    >
                                        <div className="col-span-1 text-center text-xs">
                                            {rankDisplay}
                                        </div>
                                        <div className="col-span-4 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`font-bold text-sm truncate transition-colors group-hover:text-${accentColor}-500 ${isLight ? 'text-slate-700' : 'text-zinc-200'}`}>
                                                    {file.candidateName || 'Processing...'}
                                                </div>
                                                <div className="flex -space-x-1">
                                                    {isEmailed && (
                                                        <div className={`rounded-full p-0.5 shadow-sm border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/10'}`} title="Email Sent">
                                                            <MailCheck size={10} className="text-emerald-500" />
                                                        </div>
                                                    )}
                                                    {hasDraft && !isEmailed && (
                                                        <div className={`rounded-full p-0.5 shadow-sm border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/10'}`} title="Draft Ready">
                                                            <FileEdit size={10} className="text-purple-500" />
                                                        </div>
                                                    )}
                                                    {isExported && (
                                                        <div className={`rounded-full p-0.5 shadow-sm border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/10'}`} title="Exported to PDF">
                                                            <FileCheck size={10} className="text-blue-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                {isViewed && (
                                                    <div title="Viewed by you">
                                                        <Eye size={12} className={isLight ? "text-slate-400" : "text-zinc-600"} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-xs truncate flex items-center gap-1 ${textSecondary}`}>
                                                <FileText size={10} /> {file.name}
                                            </div>
                                        </div>
                                        <div className="col-span-3 flex items-center gap-2">
                                            {scanner ? (
                                                <>
                                                    <img
                                                        src={scanner.avatarUrl || `https://ui-avatars.com/api/?name=${scanner.displayName}`}
                                                        className={`w-6 h-6 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`}
                                                        alt={scanner.displayName}
                                                    />
                                                    <span className={`text-xs font-medium truncate ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>{scanner.displayName}</span>
                                                </>
                                            ) : (
                                                <span className={`text-xs italic ${textSecondary}`}>Unknown User</span>
                                            )}
                                        </div>
                                        <div className={`col-span-2 text-xs ${textSecondary}`}>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                {new Date(file.uploadedAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 opacity-70">
                                                <Clock size={12} />
                                                {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            {file.status === 'COMPLETED' ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${score >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    score >= 50 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                                    }`}>
                                                    {score}%
                                                </span>
                                            ) : (
                                                <span className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>{file.status}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Anti-Ghosting Bar (Conditional) */}
            {canUseAntiGhosting && riskCount > 0 && (
                <div className={`sticky bottom-4 mx-4 p-4 rounded-2xl shadow-2xl flex items-center justify-between border z-20 animate-fade-in-up ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#18181b] border-white/10 text-white'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-rose-500 rounded-xl shadow-lg shadow-rose-500/20">
                            <Ghost size={24} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Ghosting Risk Detected</h4>
                            <p className={`text-xs mt-0.5 ${textSecondary}`}>
                                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    {riskCount} total
                                </span>
                                {isFiltering && (
                                    <span className="mx-1 opacity-70">
                                        • {filteredRiskCount} in view
                                    </span>
                                )}
                                <span className="opacity-70"> uncontacted.</span>
                                {candidatesWithDrafts.length > 0 && (
                                    <span className="ml-2 text-purple-500 font-bold">
                                        ({candidatesWithDrafts.length} drafts ready)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleGhostingKiller}
                            disabled={isDraftingAll || candidatesNoDrafts.length === 0}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors border disabled:opacity-50 flex items-center gap-2 ${isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 border-white/5 text-white'}`}
                        >
                            {isDraftingAll ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            {isDraftingAll ? 'Drafting...' : `Draft (${candidatesNoDrafts.length})`}
                        </button>
                        <button
                            onClick={handleSendBulk}
                            disabled={candidatesWithDrafts.length === 0 || isSendingAll}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg ${candidatesWithDrafts.length > 0
                                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-900/40'
                                : isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                }`}
                        >
                            {isSendingAll ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {isSendingAll ? 'Sending...' : `Send (${candidatesWithDrafts.length})`}
                        </button>
                    </div>
                </div>
            )}

            {/* Candidate Drawer */}
            <CandidateDrawer
                isOpen={!!selectedFile}
                selectedFile={selectedFile}
                onClose={() => setSelectedFile(null)}
                isLight={isLight}
                accentColor={accentColor}
                isTopCandidate={selectedFile ? rankMap.get(selectedFile.id) === 1 : false}
                onMarkContacted={onMarkContacted}
                onBatchUpdate={onBatchUpdate}
                currentUser={currentUser}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
            />
        </div>
    );
};

export default ActivityTab;
