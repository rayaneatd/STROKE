import React, { useState, useMemo } from 'react';
import { ProjectFile, User, Project } from '../../types';
import { debounce } from '../../utils/performance';
import { useCandidates } from '../../hooks/useCandidates';
import {
    Activity, Ghost,
    User as UserIcon, Search, Filter, SortAsc, SortDesc, Download, Loader2, Check, X,
    MailCheck, Mail, FileCheck, Eye, EyeOff,
    CheckSquare, Square, Send, PenTool, Zap, MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CandidateList from '../../components/CandidateList';
import CandidateDrawer from '../../components/CandidateDrawer';
import { supabase } from '../../lib/supabase';

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
type ActivityFilter = 'EMAILED' | 'NOT_EMAILED' | 'EXPORTED' | 'NOT_EXPORTED' | 'VIEWED' | 'NOT_VIEWED';

const ITEM_HEIGHT = 72;

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
    const [isDrafting, setIsDrafting] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // --- Selection State ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Theme Helpers
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'slate';

    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
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
        return project.members
            .map(m => m.user)
            .filter((u): u is User => !!u)
            .filter(u => 
                u.displayName.toLowerCase().includes(scannerSearch.toLowerCase()) || 
                u.email.toLowerCase().includes(scannerSearch.toLowerCase())
            );
    }, [project.members, scannerSearch]);

    const activeFiltersCount = filterScanners.length + filterScores.length + filterActivities.length;

    // --- Server-side Data Fetching ---
    const { 
        candidates, 
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
        filterUploaders: filterScanners
    });


    const uniqueScanners = contributionData.length;

    // Handlers
    const handleSearch = (val: string) => setSearch(val);
    
    const toggleFilter = <T,>(item: T, current: T[], setFn: React.Dispatch<React.SetStateAction<T[]>>) => {
        if (current.includes(item)) {
            setFn(current.filter(i => i !== item));
        } else {
            setFn([...current, item]);
        }
    };

    const clearFilters = () => {
        setFilterScanners([]);
        setFilterScores([]);
        setFilterActivities([]);
        setSearch('');
    };

    const handleCandidateClick = (file: ProjectFile) => {
        if (onMarkViewed) onMarkViewed(file.id);
        setSelectedFile(file);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleExport = () => {
        // Simple export logic for now, similar to ResumesTab but maybe for all listed
        // For now just alert or simple mock
        alert("Exporting visible list...");
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === candidates.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(candidates.map(c => c.id)));
    };

    // --- Bulk Action Helpers ---
    const visibleWithDraft = candidates.filter(c => c.emailDraft && !c.emailSentAt);
    const visibleNoDraft = candidates.filter(c => !c.emailDraft && !c.emailSentAt);
    
    const selectedCandidates = candidates.filter(c => selectedIds.has(c.id));
    const selectedWithDraft = selectedCandidates.filter(c => c.emailDraft && !c.emailSentAt);
    // For "Write Draft", we might overwrite existing or only target those without?
    // User said: "rédiger un draft à la selection". Usually implies all selected.
    // But for Anti Ghosting bar: "aux candidats qui n'ont pas le marqueur violet" (no draft).
    const selectedNoDraft = selectedCandidates.filter(c => !c.emailDraft && !c.emailSentAt);

    const handleBulkDraft = async (targetCandidates: ProjectFile[]) => {
        if (!onBatchUpdate || targetCandidates.length === 0) return;
        setIsDrafting(true);
        
        // Mocking AI draft generation for now (or simple placeholder)
        const { data, error } = await supabase.rpc('get_project_owner_ai_tone', {
            p_project_id: project.id
        });
        
        const tone = String(data || 'PROFESSIONAL').toUpperCase();
        const draft =
            tone === 'CASUAL' ? 'Casual draft...' :
            tone === 'DIRECT' ? 'Direct draft...' :
            'Professional draft...';
            
        const updates = targetCandidates.map(c => ({
            id: c.id,
            changes: { emailDraft: draft }
        }));
        
        await onBatchUpdate(updates);
        setIsDrafting(false);
        // Clear selection if it was selection based? Maybe keep it.
    };

    const handleBulkSend = async (targetCandidates: ProjectFile[]) => {
         if (!onBatchUpdate || targetCandidates.length === 0) return;
         setIsSending(true);
         
         // Mock sending - in reality we would call an API
         // Here we just mark as emailed
         const updates = targetCandidates.map(c => ({
            id: c.id,
            changes: { emailSentAt: new Date().toISOString() }
        }));
        
        await onBatchUpdate(updates);
        setIsSending(false);
        if (selectedIds.size > 0) setSelectedIds(new Set());
    };

    return (
        <div className="relative h-[calc(100vh-220px)] min-h-[600px] animate-fade-in flex flex-col gap-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
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
                        </div>
                        <div className={`text-xs ${textSecondary} font-medium uppercase tracking-wide`}>At Risk (Uncontacted)</div>
                    </div>
                </div>
            </div>

            {/* Candidate List Section */}
            <div className={`flex-1 flex flex-col rounded-[2rem] border shadow-sm overflow-hidden min-w-0 relative min-h-0 ${cardBg}`}>
                
                {/* Toolbar */}
                <div className={`p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'}`}>
                    <div className="flex flex-1 gap-2 w-full">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                            <input
                                type="text"
                                placeholder="Search all project candidates..."
                                onChange={(e) => handleSearch(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-${accentColor}-500 text-sm ${isLight ? 'bg-slate-50 border-slate-100 text-slate-800 placeholder:text-slate-400 focus:bg-white' : 'bg-black/20 border-white/5 text-white placeholder:text-zinc-600 focus:bg-black/40'}`}
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative group min-w-[140px]">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className={`w-full pl-3 pr-8 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-${accentColor}-500 appearance-none cursor-pointer ${selectBg}`}
                            >
                                <option value="DATE_DESC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Newest</option>
                                <option value="DATE_ASC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Oldest</option>
                                <option value="SCORE_DESC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Best Match</option>
                                <option value="SCORE_ASC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Lowest Match</option>
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
                                    : isLight
                                        ? 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                                        : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                    }`}
                            >
                                <Filter size={14} /> Filter
                                {activeFiltersCount > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] bg-${accentColor}-600 text-white`}>
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>

                            {/* Filter Dropdown Menu */}
                            {isFilterOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border z-30 animate-fade-in-up p-4 ${isLight ? 'bg-white border-slate-100 shadow-slate-200/50' : 'bg-[#18181b] border-white/10'}`}
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
                                                    className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-${accentColor}-500/50 transition-colors ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/5 text-zinc-300'}`}
                                                />
                                            </div>

                                            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                {availableScanners.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={(e) => { e.stopPropagation(); toggleFilter(u.id, filterScanners, setFilterScanners); }}
                                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between group transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${filterScanners.includes(u.id) ? `bg-${accentColor}-500 border-${accentColor}-500` : isLight ? 'border-slate-300 group-hover:border-slate-400' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                                                                {filterScanners.includes(u.id) && <Check size={10} className="text-white" />}
                                                            </div>
                                                            <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.displayName}`} className={`w-5 h-5 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`} alt="" />
                                                            <span className={`truncate ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{u.displayName}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                                {availableScanners.length === 0 && (
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
                                                    { id: 'NOT_EMAILED', label: 'Not Emailed', icon: <Mail size={12} /> },
                                                    { id: 'EXPORTED', label: 'Exported', icon: <FileCheck size={12} /> },
                                                    { id: 'VIEWED', label: 'Viewed by Me', icon: <Eye size={12} /> },
                                                    { id: 'NOT_VIEWED', label: 'New (Unread)', icon: <EyeOff size={12} /> },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={(e) => { e.stopPropagation(); toggleFilter(opt.id as ActivityFilter, filterActivities, setFilterActivities); }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
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
                                            <div className={`pt-2 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                                                <button onClick={clearFilters} className="w-full py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-1">
                                                    <X size={12} /> Clear Filters
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Header */}
                <div className={`grid ${selectedIds.size > 0 || candidates.length > 0 ? 'grid-cols-[40px_repeat(12,minmax(0,1fr))]' : 'grid-cols-12'} gap-4 px-8 py-4 border-b text-[10px] font-extrabold uppercase tracking-widest sticky top-[73px] z-10 ${isLight ? 'bg-white border-slate-100 text-slate-400' : 'bg-[#0e0e10] border-white/5 text-zinc-500'}`}>
                    <div className="flex justify-center items-center">
                        <div
                            onClick={handleSelectAll}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${selectedIds.size > 0 && selectedIds.size === candidates.length
                                ? `bg-${accentColor}-500 border-${accentColor}-500`
                                : isLight ? 'border-slate-300 hover:border-slate-400' : 'border-zinc-700 hover:border-zinc-500'
                                }`}
                        >
                            {selectedIds.size > 0 && selectedIds.size === candidates.length && <Check size={12} className="text-white" />}
                            {selectedIds.size > 0 && selectedIds.size < candidates.length && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </div>
                    </div>
                    <div className="col-span-1 text-center flex justify-center">Rank</div>
                    <div className="col-span-4">Candidate Profile</div>
                    <div className="col-span-3">Scanned By</div>
                    <div className="col-span-2 text-right">Date</div>
                    <div className="col-span-2 text-right">Score</div>
                </div>

                {/* Candidate List Component */}
                <CandidateList
                    candidates={candidates}
                    selectedFileId={selectedFile?.id || null}
                    onSelect={handleCandidateClick}
                    currentUser={currentUser}
                    sortOption={sortOption}
                    isLight={isLight}
                    accentColor={accentColor}
                    onScroll={handleScroll}
                    itemHeight={ITEM_HEIGHT}
                    showScannedBy={true}
                    userMap={userMap}
                    showCheckboxes={true}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                />
                
                {/* Anti Ghosting Bar */}
                <div className={`shrink-0 border-t p-3 flex items-center justify-between transition-colors ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-white/10'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isLight ? 'bg-white text-slate-400 border border-slate-200' : 'bg-white/5 text-zinc-500 border-white/5'}`}>
                            <Ghost size={16} />
                        </div>
                        <div>
                            <div className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                                {selectedIds.size > 0 ? 'Selection Action' : 'Anti Ghosting'}
                            </div>
                            <div className={`text-sm font-bold ${textPrimary}`}>
                                {selectedIds.size > 0 ? `${selectedIds.size} Selected` : `${candidates.length} Visible Candidates`}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 ? (
                            <>
                                <button
                                    onClick={() => handleBulkDraft(selectedCandidates)}
                                    disabled={isDrafting || selectedCandidates.length === 0}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isLight
                                        ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        : 'bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10'}`}
                                >
                                    {isDrafting ? <Loader2 size={14} className="animate-spin" /> : <PenTool size={14} />}
                                    Write Drafts ({selectedCandidates.length})
                                </button>
                                <button
                                    onClick={() => handleBulkSend(selectedCandidates)}
                                    disabled={isSending || selectedCandidates.length === 0}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white transition-colors bg-${accentColor}-600 hover:bg-${accentColor}-500 shadow-lg shadow-${accentColor}-500/20`}
                                >
                                    {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Send Selection ({selectedCandidates.length})
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleBulkDraft(visibleNoDraft)}
                                    disabled={isDrafting || visibleNoDraft.length === 0}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isLight
                                        ? 'bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100'
                                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'}`}
                                    title="Generate drafts for visible candidates without a draft"
                                >
                                    {isDrafting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                    Bulk Draft ({visibleNoDraft.length})
                                </button>
                                <button
                                    onClick={() => handleBulkSend(visibleWithDraft)}
                                    disabled={isSending || visibleWithDraft.length === 0}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isLight
                                        ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'}`}
                                    title="Send emails to visible candidates with a draft ready"
                                >
                                    {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Send Drafts ({visibleWithDraft.length})
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Full Screen Drawer */}
                <CandidateDrawer
                    isOpen={!!selectedFile}
                    candidateId={selectedFile?.id || null}
                    onClose={() => setSelectedFile(null)}
                />
            </div>
        </div>
    );
};

export default ActivityTab;
