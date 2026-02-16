
import React, { useState, useMemo, useEffect } from 'react';
import { ProjectFile, User, Project, ProjectRole } from '../../types';
import { generateAIEmailDraft, generateReport, saveCandidateDraft, markCandidateContacted } from '../../services/mockData';
import {
    Activity, Calendar, Clock, Download, FileText, Filter, Ghost,
    Loader2, Search, Send, User as UserIcon, Wand2, MailCheck,
    SortAsc, SortDesc, Check, X,
    Crown, Medal, Award, Trophy, // Rank Icons
    ExternalLink, Eye, BrainCircuit, Mail, Sparkles, ThumbsUp, ThumbsDown, Phone, MapPin, GraduationCap, Edit3, FileCheck, EyeOff, FileEdit
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '../../hooks/useVirtualizer';

interface ActivityTabProps {
    files: ProjectFile[];
    project: Project;
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
type DrawerTab = 'ANALYSIS' | 'COMMUNICATION' | 'RESUME';

const ITEM_HEIGHT = 72;
const CONTAINER_HEIGHT = 600;

const ActivityTab: React.FC<ActivityTabProps> = ({
    files,
    project,
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
    const [drawerTab, setDrawerTab] = useState<DrawerTab>('ANALYSIS');
    const [aiPrompt, setAiPrompt] = useState('');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Theme Helpers
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'slate';

    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const borderClass = isLight ? 'border-slate-100' : 'border-white/5';
    const itemHoverClass = isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white' : 'bg-black/20 border-white/5 text-white placeholder:text-zinc-600';

    const selectBg = isLight
        ? 'bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-slate-100'
        : 'bg-[#18181b] border-white/10 text-zinc-300 focus:ring-2 focus:ring-white/5';

    // Map user IDs to User objects for quick lookup
    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        project.members.forEach(m => {
            if (m.user) map.set(m.userId, m.user);
        });
        return map;
    }, [project.members]);

    // Get unique scanners for filter dropdown
    const availableScanners = useMemo(() => {
        const ids = new Set(files.map(f => f.uploadedByUserId).filter(Boolean));
        return Array.from(ids).map(id => userMap.get(id!)!).filter(Boolean);
    }, [files, userMap]);

    const activeFiltersCount = filterScanners.length + filterScores.length + filterActivities.length;
    const isFiltering = activeFiltersCount > 0 || search.length > 0;

    // --- Rank Calculation ---
    const rankMap = useMemo(() => {
        const scoredFiles = files
            .filter(f => f.status === 'COMPLETED' && typeof f.score === 'number')
            .sort((a, b) => (b.score || 0) - (a.score || 0));

        const map = new Map<string, number>();
        scoredFiles.forEach((f, index) => {
            map.set(f.id, index + 1);
        });
        return map;
    }, [files]);

    const filteredFiles = useMemo(() => {
        let result = [...files];

        // 1. Search
        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(f =>
                f.candidateName?.toLowerCase().includes(lower) ||
                f.name.toLowerCase().includes(lower) ||
                userMap.get(f.uploadedByUserId || '')?.displayName.toLowerCase().includes(lower)
            );
        }

        // 2. Filter by Scanner (Multi-select OR)
        if (filterScanners.length > 0) {
            result = result.filter(f => f.uploadedByUserId && filterScanners.includes(f.uploadedByUserId));
        }

        // 3. Filter by Score (Multi-select OR)
        if (filterScores.length > 0) {
            result = result.filter(f => {
                const s = f.score || 0;
                return filterScores.some(range => {
                    if (range === 'HIGH') return s >= 80;
                    if (range === 'MID') return s >= 50 && s < 80;
                    if (range === 'LOW') return s < 50;
                    return false;
                });
            });
        }

        // 4. Filter by Activity Markers (Multi-select OR)
        if (filterActivities.length > 0) {
            result = result.filter(f => {
                return filterActivities.some(filter => {
                    const isEmailed = !!f.emailSentAt;
                    const isExported = f.exportedBy?.includes(currentUser.id);
                    const isViewed = f.viewedBy?.includes(currentUser.id);
                    const hasDraft = !!f.emailDraft;

                    switch (filter) {
                        case 'EMAILED': return isEmailed;
                        case 'NOT_EMAILED': return !isEmailed;
                        case 'EXPORTED': return isExported;
                        case 'NOT_EXPORTED': return !isExported;
                        case 'VIEWED': return isViewed;
                        case 'NOT_VIEWED': return !isViewed;
                        case 'HAS_DRAFT': return hasDraft;
                        default: return false;
                    }
                });
            });
        }

        // 5. Sort
        result.sort((a, b) => {
            switch (sortOption) {
                case 'DATE_DESC': return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
                case 'DATE_ASC': return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
                case 'SCORE_DESC': return (b.score || 0) - (a.score || 0);
                case 'SCORE_ASC': return (a.score || 0) - (b.score || 0);
                default: return 0;
            }
        });

        return result;
    }, [files, search, userMap, filterScanners, filterScores, filterActivities, sortOption, currentUser.id]);

    // STRICT At Risk Logic:
    // Defined as any candidate who has NOT been emailed.
    const riskCandidates = useMemo(() => files.filter(f => !f.emailSentAt && f.status !== 'FAILED'), [files]);

    // FILTERED Risk Logic:
    // Uncontacted candidates strictly within the CURRENT filtered view
    const filteredRiskCandidates = useMemo(() => filteredFiles.filter(f => !f.emailSentAt && f.status !== 'FAILED'), [filteredFiles]);

    // Sub-lists for actions (Scoped to FILTERED list so buttons only act on what is visible)
    const candidatesWithDrafts = useMemo(() => filteredRiskCandidates.filter(f => !!f.emailDraft), [filteredRiskCandidates]);
    const candidatesNoDrafts = useMemo(() => filteredRiskCandidates.filter(f => !f.emailDraft), [filteredRiskCandidates]);

    // Counts for Display
    const riskCount = riskCandidates.length; // Global Risk
    const filteredRiskCount = filteredRiskCandidates.length; // View Risk

    // --- Virtualization ---
    const { visibleItems, totalHeight, onScroll } = useVirtualizer({
        itemCount: filteredFiles.length,
        itemHeight: ITEM_HEIGHT,
        containerHeight: CONTAINER_HEIGHT,
    });

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

    const handleEmailContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setGeneratedEmail(val);
        if (selectedFile) {
            selectedFile.emailDraft = val;
            if (onBatchUpdate) {
                onBatchUpdate([{ id: selectedFile.id, changes: { emailDraft: val } }]);
            }
        }
    };

    const handleGenerateSingleEmail = () => {
        if (!selectedFile) return;
        setIsGeneratingEmail(true);
        setGeneratedEmail('');
        setTimeout(() => {
            const draft = generateAIEmailDraft(selectedFile.candidateName || 'Candidate', selectedFile.score || 0);
            setGeneratedEmail(draft);
            selectedFile.emailDraft = draft;

            if (onBatchUpdate) {
                onBatchUpdate([{ id: selectedFile.id, changes: { emailDraft: draft } }]);
            }

            setIsGeneratingEmail(false);
        }, 1500);
    };

    const handleSendSingleEmail = () => {
        if (onMarkContacted && selectedFile && !isEmailSent) {
            onMarkContacted(selectedFile.id);
            const now = new Date().toISOString();

            const update = {
                emailSentAt: now,
                emailDraft: undefined
            };

            setSelectedFile(prev => prev ? { ...prev, ...update } : null);
            setIsEmailSent(true);
            setGeneratedEmail(`[Email sent on ${new Date(now).toLocaleDateString()}]`);

            if (onBatchUpdate) {
                onBatchUpdate([{ id: selectedFile.id, changes: update }]);
            }
        }
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
        setDrawerTab('ANALYSIS');

        const alreadySent = !!file.emailSentAt;
        setIsEmailSent(alreadySent);

        if (alreadySent) {
            setGeneratedEmail(`[Email sent on ${new Date(file.emailSentAt!).toLocaleDateString()}]`);
        } else {
            setGeneratedEmail(file.emailDraft || '');
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setIsFilterOpen(false);
        if (isFilterOpen) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isFilterOpen]);

    const getMockCandidateDetails = (file: ProjectFile) => {
        const score = file.score || 0;
        let summary = "";
        if (score > 85) summary = "An exceptional candidate with strong alignment to the core requirements. Demonstrated leadership in previous roles and possesses the exact tech stack needed.";
        else if (score > 70) summary = "A solid contender with most key skills. Experience is relevant but might need some ramp-up time on specific internal tools. Good cultural fit potential.";
        else summary = "Missing several key qualifications. Experience is tangential but shows potential for a more junior or different role.";

        return {
            email: `${file.candidateName?.toLowerCase().replace(' ', '.')}@example.com`,
            phone: "+1 (555) 123-4567",
            location: "Remote / Hybrid",
            summary,
            skills: score > 80 ? ['React', 'TypeScript', 'Node.js', 'System Design'] : ['JavaScript', 'HTML/CSS', 'Communication']
        };
    };

    const totalScans = files.length;
    const uniqueScanners = new Set(files.map(f => f.uploadedByUserId)).size;

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
                                                    { id: 'NOT_EMAILED', label: 'Not Emailed', icon: <Mail size={12} /> },
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
                                const rank = rankMap.get(file.id);

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

            {/* Drawer */}
            {selectedFile && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedFile(null)}></div>
                    <div className={`relative w-full max-w-6xl h-full shadow-2xl flex flex-col animate-fade-in-right border-l ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/10'}`}>
                        {/* Drawer Header */}
                        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-sm border ${isLight ? `bg-${accentColor}-50 text-${accentColor}-600 border-${accentColor}-100` : `bg-${accentColor}-500/10 text-${accentColor}-400 border-${accentColor}-500/20`}`}>
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className={`text-2xl font-bold leading-tight ${textPrimary}`}>{selectedFile.candidateName}</h2>
                                        {selectedFile.emailSentAt && (
                                            <div className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                                                <MailCheck size={12} /> Contacted {new Date(selectedFile.emailSentAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-xs flex items-center gap-1.5 mt-1 ${textSecondary}`}>
                                        <FileText size={12} /> {selectedFile.name} • Added {new Date(selectedFile.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {rankMap.get(selectedFile.id) === 1 && (
                                    <div className="px-4 py-1.5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-amber-500 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-500/20 shadow-sm">
                                        <Trophy size={14} className="fill-current" /> Top Candidate
                                    </div>
                                )}
                                <button onClick={() => setSelectedFile(null)} className={`p-2 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Body - Split View */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left: PDF Visualization */}
                            <div className={`flex-1 p-8 flex flex-col overflow-hidden relative border-r ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050505] border-white/5'}`}>
                                <div className="absolute top-6 right-8 flex gap-2 z-10">
                                    <button className={`p-2.5 backdrop-blur rounded-xl shadow-sm border transition-all hover:scale-105 ${isLight ? 'bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border-slate-200' : 'bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border-white/10'}`} title="Open external"><ExternalLink size={18} /></button>
                                    <button className={`p-2.5 backdrop-blur rounded-xl shadow-sm border transition-all hover:scale-105 ${isLight ? 'bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border-slate-200' : 'bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border-white/10'}`} title="Quick Preview"><Eye size={18} /></button>
                                </div>
                                <div className={`flex-1 shadow-xl rounded-2xl overflow-y-auto custom-scrollbar p-10 flex flex-col gap-8 items-center border w-full ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/5'}`}>
                                    <div className="w-full max-w-3xl space-y-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                                        <div className={`h-10 rounded w-1/2 mb-10 ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}></div>
                                        <div className="space-y-3">
                                            <div className={`h-4 rounded w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                            <div className={`h-4 rounded w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                            <div className={`h-4 rounded w-3/4 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                        </div>
                                        <div className={`h-40 rounded-2xl w-full border-2 border-dashed flex items-center justify-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
                                            <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>[Resume Content]</span>
                                        </div>
                                        <div className="space-y-3 pt-6">
                                            <div className={`h-5 rounded w-1/4 mb-4 ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}></div>
                                            <div className={`h-4 rounded w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                            <div className={`h-4 rounded w-5/6 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Rich AI Drawer */}
                            <div className={`w-full lg:w-[450px] flex flex-col h-full ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}`}>
                                <div className={`flex p-4 border-b gap-2 ${borderClass} ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}`}>
                                    <button
                                        onClick={() => setDrawerTab('ANALYSIS')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${drawerTab === 'ANALYSIS' ? (isLight ? `bg-slate-100 text-slate-900 shadow-sm border border-slate-200` : 'bg-white/10 text-white shadow-sm border border-white/5') : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                                    >
                                        <BrainCircuit size={14} /> Analysis
                                    </button>
                                    <button
                                        onClick={() => setDrawerTab('COMMUNICATION')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${drawerTab === 'COMMUNICATION' ? 'bg-purple-500/10 text-purple-500 shadow-sm border border-purple-500/20' : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                                    >
                                        <Mail size={14} /> Email
                                    </button>
                                    <button
                                        onClick={() => setDrawerTab('RESUME')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${drawerTab === 'RESUME' ? `bg-${accentColor}-500/10 text-${accentColor}-500 shadow-sm border border-${accentColor}-500/20` : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                                    >
                                        <FileText size={14} /> Profile
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                    {drawerTab === 'ANALYSIS' && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className={`rounded-3xl p-6 border relative overflow-hidden ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#18181b] border-white/5'}`}>
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div>
                                                        <h3 className={`text-3xl font-black ${textPrimary}`}>{selectedFile.score}%</h3>
                                                        <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${textSecondary}`}>Match Score</p>
                                                    </div>
                                                    <div className="w-16 h-16 relative">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className={isLight ? "text-slate-200" : "text-zinc-800"} />
                                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * (selectedFile.score || 0)) / 100} className={`text-${accentColor}-500 transition-all duration-1000 ease-out`} strokeLinecap="round" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className={`mt-4 pt-4 border-t ${borderClass}`}>
                                                    <div className="flex gap-2">
                                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md text-[10px] font-bold border border-emerald-500/20">Strong Technical Fit</span>
                                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md text-[10px] font-bold border border-blue-500/20">Leadership Potential</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${textSecondary}`}>AI Executive Summary</h4>
                                                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                    {getMockCandidateDetails(selectedFile).summary}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                                                    <h5 className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase mb-2"><ThumbsUp size={12} /> Key Strengths</h5>
                                                    <ul className={`text-xs space-y-1 list-disc pl-3 ${isLight ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                                        <li>Advanced React Patterns</li>
                                                        <li>Team Leadership (5+ yrs)</li>
                                                        <li>System Architecture</li>
                                                    </ul>
                                                </div>
                                                <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                                                    <h5 className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase mb-2"><ThumbsDown size={12} /> Potential Risks</h5>
                                                    <ul className={`text-xs space-y-1 list-disc pl-3 ${isLight ? 'text-rose-700' : 'text-zinc-400'}`}>
                                                        <li>Short tenure in 2021</li>
                                                        <li>Salary expectations</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ... Communication and Resume tabs remain unchanged ... */}
                                    {drawerTab === 'COMMUNICATION' && (
                                        <div className="space-y-6 animate-fade-in h-full flex flex-col">
                                            <div className={`bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 transition-opacity ${isEmailSent ? 'opacity-50 pointer-events-none' : ''}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-xs font-bold text-purple-500 uppercase tracking-wider block flex items-center gap-2">
                                                        <Sparkles size={14} className="text-purple-500" /> AI Composer
                                                    </label>
                                                    <button
                                                        onClick={handleGenerateSingleEmail}
                                                        disabled={isGeneratingEmail || isEmailSent}
                                                        className="text-[10px] font-bold bg-purple-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-purple-500 transition-colors disabled:opacity-50"
                                                    >
                                                        {isGeneratingEmail ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                                        Generate Response
                                                    </button>
                                                </div>
                                                <textarea
                                                    className={`w-full p-3 text-sm rounded-xl border border-white/10 focus:ring-1 focus:ring-purple-500 focus:outline-none min-h-[80px] resize-none disabled:opacity-50 ${isLight ? 'bg-white text-slate-800 placeholder:text-slate-400 border-purple-200' : 'bg-black/20 text-white placeholder:text-zinc-600'}`}
                                                    placeholder="Any specific context? e.g. Mention salary range..."
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    disabled={isEmailSent}
                                                />
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className={`text-xs font-extrabold uppercase tracking-widest ${textSecondary}`}>
                                                        Email Draft {isEmailSent && <span className="text-emerald-500 ml-1">(Sent)</span>}
                                                    </h4>
                                                    <Edit3 size={14} className={textSecondary} />
                                                </div>
                                                <textarea
                                                    value={generatedEmail}
                                                    onChange={handleEmailContentChange}
                                                    disabled={isEmailSent}
                                                    className={`flex-1 w-full border rounded-2xl p-6 shadow-sm font-mono text-sm leading-relaxed whitespace-pre-wrap focus:outline-none focus:border-${accentColor}-500 resize-none ${isEmailSent ? (isLight ? 'bg-slate-50 cursor-not-allowed' : 'bg-white/5 cursor-not-allowed') : (isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#18181b] border-white/10 text-zinc-300')}`}
                                                    placeholder="Generate a draft or start typing..."
                                                />
                                            </div>

                                            <div className={`flex gap-3 pt-4 border-t ${borderClass}`}>
                                                {!isEmailSent && (
                                                    <button
                                                        onClick={() => { setGeneratedEmail(''); if (selectedFile && onBatchUpdate) onBatchUpdate([{ id: selectedFile.id, changes: { emailDraft: '' } }]) }}
                                                        className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleSendSingleEmail}
                                                    disabled={!generatedEmail || isEmailSent}
                                                    className={`flex-[2] py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 ${isEmailSent
                                                        ? 'bg-emerald-600 text-white cursor-default shadow-none'
                                                        : isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-zinc-200'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {isEmailSent ? <MailCheck size={14} /> : <Send size={14} />}
                                                    {isEmailSent ? 'Email Sent' : 'Send Email'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {drawerTab === 'RESUME' && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div>
                                                <h4 className={`text-xs font-extrabold uppercase tracking-widest mb-4 ${textSecondary}`}>Key Details</h4>
                                                <div className="space-y-4">
                                                    <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                        <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><Mail size={18} /></div>
                                                        <span className="truncate font-medium">{getMockCandidateDetails(selectedFile).email}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                        <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><Phone size={18} /></div>
                                                        <span className="font-medium">{getMockCandidateDetails(selectedFile).phone}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                        <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><MapPin size={18} /></div>
                                                        <span className="font-medium">{getMockCandidateDetails(selectedFile).location}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                        <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><GraduationCap size={18} /></div>
                                                        <span className="font-medium">Bachelor's Degree</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className={`text-xs font-extrabold uppercase tracking-widest mb-4 ${textSecondary}`}>Extracted Skills</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {getMockCandidateDetails(selectedFile).skills.map(skill => (
                                                        <span key={skill} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-default ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-[#18181b] hover:bg-white/5 text-zinc-300 border-white/5'}`}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityTab;
