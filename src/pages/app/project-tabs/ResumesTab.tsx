
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
    Upload, Loader2, FileText, Clock,
    X, Search, Filter, Zap,
    SortAsc, SortDesc,
    Download, FileCheck, FolderUp,
    Medal, Trophy, Sparkles, User as UserIcon, Mail, Phone, MapPin, ExternalLink, Eye, GraduationCap,
    FileUp, AlertCircle, Crown, Award, Send, ThumbsUp, ThumbsDown, BrainCircuit, Wand2, Ghost, MailCheck, Edit3, Check, EyeOff, RotateCcw, AlertTriangle,
    Linkedin, Github, Briefcase, TrendingUp, AlertOctagon, HelpCircle, MessageSquare, Code
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProjectFile, User, ProjectMember } from '../../../types';
import { useCandidates } from '../../../hooks/useCandidates';
import { debounce } from '../../../utils/performance';
import { generateReport, generateAIEmailDraft } from '../../../services/mockData';
import { useVirtualizer } from '../../../hooks/useVirtualizer';
import CandidateDrawer from '../../../components/CandidateDrawer';
import CandidateList from '../../../components/CandidateList';

interface ResumesTabProps {
    projectId: string; // Added projectId
    files?: ProjectFile[]; // Made optional as we use hook
    members?: ProjectMember[]; // Added for scanner filter
    isUploading: boolean;
    handleFilesAdded: (files: File[]) => void;
    onScan: () => void;
    onRemoveFile: (fileId: string) => void;
    onRetryFile: (fileId: string) => void;
    isReadOnly?: boolean;
    checkProjectStatus?: () => void;
    canUseAntiGhosting?: boolean;
    onMarkContacted?: (fileId: string) => void;
    onMarkViewed?: (fileId: string) => void;
    onMarkExported?: (fileId: string) => void;
    onBatchUpdate?: (updates: { id: string, changes: Partial<ProjectFile> }[]) => void;
    currentUser: User;
}


const ITEM_HEIGHT = 80;
const CONTAINER_HEIGHT = 600;
const PENDING_ITEM_HEIGHT = 56; // Smaller height for upload list

const ACCENT_HEX_MAP: Record<string, string> = {
    slate: '#64748b',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    emerald: '#10b981',
    violet: '#8b5cf6',
    rose: '#f43f5e',
    amber: '#f59e0b',
};

type SortOption = 'SCORE_DESC' | 'SCORE_ASC' | 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC';
type ScoreFilter = 'HIGH' | 'MID' | 'LOW';
type ActivityFilter = 'EMAILED' | 'NOT_EMAILED' | 'EXPORTED' | 'NOT_EXPORTED' | 'VIEWED' | 'NOT_VIEWED';
type DrawerTab = 'ANALYSIS' | 'COMMUNICATION' | 'RESUME' | 'INTERVIEW';

// Helper to scan directory entries recursively (Moved outside component to avoid re-creation and potential scope issues)
const scanFiles = async (item: FileSystemEntry): Promise<File[]> => {
    if (item.isFile) {
        return new Promise((resolve) => {
            (item as FileSystemFileEntry).file((file) => {
                resolve([file]);
            });
        });
    } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
            dirReader.readEntries((entries) => resolve(entries));
        });
        const files = await Promise.all(entries.map(entry => scanFiles(entry)));
        return files.flat();
    }
    return [];
};

const ResumesTab: React.FC<ResumesTabProps> = ({
    projectId,
    files = [],
    members = [],
    isUploading,
    handleFilesAdded,
    onScan,
    onRemoveFile,
    onRetryFile,
    isReadOnly,
    canUseAntiGhosting,
    onMarkContacted,
    onMarkViewed,
    onMarkExported,
    onBatchUpdate,
    currentUser
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFailedDetails, setShowFailedDetails] = useState(false);

    // --- Enhanced Filter & Sort State ---
    const [sortOption, setSortOption] = useState<SortOption>('SCORE_DESC');
    const [filterScores, setFilterScores] = useState<ScoreFilter[]>([]);
    const [filterActivities, setFilterActivities] = useState<ActivityFilter[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // --- Derived Lists ---
    // Map user IDs to User objects for quick lookup
    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        members.forEach(m => {
            if (m.user) map.set(m.userId, m.user);
        });
        return map;
    }, [members]);

    // Server-side Pagination & Filtering (My Scans)
    const {
        candidates: myCandidates,
        totalCount: totalCompleted,
        fetchNextPage: fetchNextCompleted,
        hasNextPage: hasNextCompleted,
        isFetchingNextPage: isFetchingNextCompleted,
        isLoading: isCompletedLoading
    } = useCandidates({
        projectId,
        userId: currentUser.id,
        searchQuery,
        sortOption,
        filterScores,
        filterActivities,
        filterUploaders: [currentUser.id]
    });

    const candidates = myCandidates;


    // Selection & Drawer State
    const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);

    // Track exported files locally
    const [isExporting, setIsExporting] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [justUploaded, setJustUploaded] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // Theme Helpers
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';
    const themeColorHex = ACCENT_HEX_MAP[accentColor] || '#3b82f6';

    const cardBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/5';
    const textPrimary = isLight ? 'text-slate-900' : 'text-zinc-200';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const uploadAreaClass = isLight
        ? 'bg-white border-slate-200 shadow-sm'
        : 'bg-[#0e0e10] border-white/5';

    const selectBg = isLight
        ? 'bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-slate-100'
        : 'bg-[#18181b] border-white/10 text-zinc-300 focus:ring-2 focus:ring-white/5';

    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-white/5 border-white/10 text-white placeholder:text-zinc-500';

    // State to track files that are currently processing or have just finished processing
    const [processingFileIds, setProcessingFileIds] = useState<Set<string>>(new Set());
    const [animatingOutFileIds, setAnimatingOutFileIds] = useState<Set<string>>(new Set());

    const pendingFiles = useMemo(() => {
        return files.filter(f => (f.status === 'PENDING' || f.status === 'PROCESSING') && !animatingOutFileIds.has(f.id));
    }, [files, animatingOutFileIds]);

    const failedFiles = useMemo(() => {
        return files.filter(f => f.status === 'FAILED');
    }, [files]);

    const isProcessingActive = pendingFiles.some(f => f.status === 'PROCESSING');

    const activeFiltersCount = filterScores.length + filterActivities.length;

    // --- Filtering & Sorting ---
    const handleSearch = useCallback(debounce((query: string) => {
        setSearchQuery(query);
    }, 300), []);

    const toggleFilter = <T,>(item: T, current: T[], setFn: React.Dispatch<React.SetStateAction<T[]>>) => {
        if (current.includes(item)) {
            setFn(current.filter(i => i !== item));
        } else {
            setFn([...current, item]);
        }
    };

    const clearFilters = () => {
        setFilterScores([]);
        setFilterActivities([]);
        setSearchQuery('');
    };

    // --- Virtualization for Candidates (Moved to CandidateList) ---
    // We only need the scroll handler for infinite loading
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        // Load more when near bottom (200px threshold)
        if (scrollHeight - scrollTop - clientHeight < 200 && hasNextCompleted && !isFetchingNextCompleted) {
            fetchNextCompleted();
        }
    };

    // --- Virtualization for Pending/Upload List (Optimization) ---
    const pendingListRef = useRef<HTMLDivElement>(null);
    const [measuredPendingHeight, setMeasuredPendingHeight] = useState(300);

    useEffect(() => {
        if (pendingFiles.length === 0) return;

        const element = pendingListRef.current;
        if (!element) return;

        // Initial measurement
        setMeasuredPendingHeight(element.clientHeight || 300);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    setMeasuredPendingHeight(entry.contentRect.height);
                }
            }
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [pendingFiles.length > 0]);

    const { visibleItems: visiblePending, totalHeight: totalPendingHeight, onScroll: onPendingScroll } = useVirtualizer({
        itemCount: pendingFiles.length,
        itemHeight: PENDING_ITEM_HEIGHT,
        containerHeight: measuredPendingHeight,
    });

    const handlePendingScroll = (e: React.UIEvent<HTMLDivElement>) => {
        onPendingScroll(e);
    };

    // Auto-scroll to top when processing starts
    useEffect(() => {
        if (isProcessingActive && pendingListRef.current) {
            pendingListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [isProcessingActive]);

    const triggerIgnite = () => {
        if (pendingFiles.length === 0) return;

        // Mark all current pending files for processing animation
        setProcessingFileIds(new Set(pendingFiles.map(f => f.id)));
        onScan();
    };

    // Effect to handle files transitioning from PROCESSING to removed (animated out)
    useEffect(() => {
        // Files that were processing but are no longer in the 'files' prop
        const currentFileIds = new Set(files.map(f => f.id));
        const newlyRemovedProcessedFiles = new Set<string>();

        processingFileIds.forEach(id => {
            if (!currentFileIds.has(id)) {
                newlyRemovedProcessedFiles.add(id);
            }
        });

        if (newlyRemovedProcessedFiles.size > 0) {
            setAnimatingOutFileIds(prev => new Set([...Array.from(prev), ...Array.from(newlyRemovedProcessedFiles)]));
            setProcessingFileIds(prev => {
                const newSet = new Set(prev);
                newlyRemovedProcessedFiles.forEach(id => newSet.delete(id));
                return newSet;
            });

            // After animation duration, remove from animatingOutFileIds
            setTimeout(() => {
                setAnimatingOutFileIds(prev => {
                    const newSet = new Set(prev);
                    newlyRemovedProcessedFiles.forEach(id => newSet.delete(id));
                    return newSet;
                });
            }, 500); // Match animation duration
        }
    }, [files, processingFileIds]);

    // --- Handlers ---

    const handleFilesAddedWrapper = (files: File[]) => {
        // Trigger Spark Effect
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 800);
        handleFilesAdded(files);
    };

    const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesAddedWrapper(Array.from(e.target.files));
        }
        if (e.target.value) e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isReadOnly) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isReadOnly) return;

        const items = Array.from(e.dataTransfer.items);
        const acceptedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

        // Check if any item is a directory
        const hasDirectory = items.some(item => {
            // Use type assertion for non-standard webkitGetAsEntry
            const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
            return entry && entry.isDirectory;
        });

        if (hasDirectory) {
            // Modern Directory Handling
            const filePromises = items.map(item => {
                const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
                if (entry) return scanFiles(entry);
                return Promise.resolve([] as File[]);
            });

            const allFiles = (await Promise.all(filePromises)).flat() as File[];
            const validFiles = allFiles.filter((file: File) => acceptedTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc'));

            if (validFiles.length > 0) {
                handleFilesAddedWrapper(validFiles);
            } else {
                // Fallback or error if no valid files found in folders
            }
        } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Fallback for browsers without webkitGetAsEntry
            const validFiles = Array.from(e.dataTransfer.files).filter((file: File) => acceptedTypes.includes(file.type)) as File[];

            if (validFiles.length > 0) {
                handleFilesAddedWrapper(validFiles);
            } else {
                alert(t('project.resumes.errors.invalidFileType'));
            }
        }
    };

    // Paste Handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (isReadOnly || isProcessingActive) return;
            if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
                e.preventDefault();
                const files = Array.from(e.clipboardData.files);
                const acceptedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
                const validFiles = files.filter(file => acceptedTypes.includes(file.type));

                if (validFiles.length > 0) {
                    // Trigger visual feedback manually before processing
                    setIsCardHovered(true);
                    setTimeout(() => setIsCardHovered(false), 500);
                    handleFilesAddedWrapper(validFiles);
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [isReadOnly, isProcessingActive]);

    const handleExport = () => {
        const candidatesToExport = candidates;

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

    const handleExportCSV = () => {
        const candidatesToExport = candidates;

        if (candidatesToExport.length === 0) {
            alert(t('project.resumes.errors.noCandidatesExport'));
            return;
        }

        const headers = ['Name', 'Email', 'Phone', 'Match Score', 'Status', 'Uploaded Date'];
        const csvContent = [
            headers.join(','),
            ...candidatesToExport.map(c => [
                `"${c.candidateName}"`,
                `"${c.email || ''}"`,
                `"${c.phone || ''}"`,
                `"${c.matchScore || 0}"`,
                `"${c.status}"`,
                `"${new Date(c.uploadedAt).toLocaleDateString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `candidates_export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExportMenuOpen(false);
    };

    const handleExportJSON = () => {
        const candidatesToExport = candidates;

        if (candidatesToExport.length === 0) {
            alert(t('project.resumes.errors.noCandidatesExport'));
            return;
        }

        const jsonContent = JSON.stringify(candidatesToExport, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `candidates_export_${new Date().getTime()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExportMenuOpen(false);
    };

    const handleCandidateClick = (file: ProjectFile) => {
        if (onMarkViewed) onMarkViewed(file.id);
        setSelectedFile(file);
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setIsFilterOpen(false);
            setIsExportMenuOpen(false);
        };
        if (isFilterOpen || isExportMenuOpen) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isFilterOpen, isExportMenuOpen]);



    return (
        <div className="relative h-[calc(125vh-240px)] min-h-[500px] animate-fade-in flex flex-col lg:flex-row gap-6">
            {/* Left Panel: Upload Area */}
            <div className="flex-1 flex flex-col gap-4 h-full min-w-0 lg:max-w-md xl:max-w-lg relative">
                <div
                    className={`flex-1 rounded-[2rem] border relative overflow-hidden flex flex-col shadow-sm transition-all duration-500 premium-border-glow ${uploadAreaClass} ${isDragging ? `ring-2 ring-${accentColor}-500/50 scale-[1.01] shadow-2xl shadow-${accentColor}-500/20 z-50` : ''} ${isProcessingActive ? 'turbo-mode z-50' : ''} ${isCardHovered && !isProcessingActive && !isDragging ? `shadow-2xl shadow-${accentColor}-500/10 -translate-y-1 z-40` : ''}`}
                    style={{ '--theme-color': themeColorHex } as React.CSSProperties}
                    onMouseEnter={() => setIsCardHovered(true)}
                    onMouseLeave={() => setIsCardHovered(false)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Spark Effect on Upload */}
                    {justUploaded && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden rounded-[2rem]">
                            <div className="absolute inset-0 bg-white/20 animate-spark mix-blend-overlay"></div>
                            <div className={`absolute inset-0 bg-${accentColor}-500/10 animate-pulse-fast`}></div>
                            <Zap size={120} className="text-white animate-spark absolute drop-shadow-[0_0_25px_rgba(255,255,255,1)]" />
                        </div>
                    )}

                    {/* Decoration - Lightning Effect when Processing */}
                    {isProcessingActive && (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <div className="scan-line-effect" style={{ background: `linear-gradient(to right, transparent, ${themeColorHex}, transparent)`, boxShadow: `0 0 8px ${themeColorHex}` }}></div>
                            <div className={`absolute inset-0 bg-${accentColor}-500/10 animate-pulse-fast`}></div>
                            {/* Lightning Flash Overlay */}
                            <div className="absolute inset-0 bg-white mix-blend-overlay animate-lightning"></div>
                        </div>
                    )}

                    {/* Subtle Background Mesh/Gradient that reacts to hover */}
                    <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,${isLight ? 'rgba(14,165,233,0.08)' : 'rgba(56,189,248,0.03)'},transparent)] opacity-70 pointer-events-none transition-all duration-700 ${isCardHovered ? 'scale-110 opacity-100' : ''}`}></div>
                    <div className={`absolute -right-20 -top-20 w-64 h-64 bg-${accentColor}-500/5 rounded-full blur-3xl transition-all duration-700 ${isCardHovered ? 'scale-150 opacity-20' : ''}`}></div>
                    <div className={`absolute -left-20 -bottom-20 w-64 h-64 bg-${accentColor}-500/5 rounded-full blur-3xl transition-all duration-700 ${isCardHovered ? 'scale-150 opacity-20' : ''}`}></div>

                    <div className="relative z-10 flex-1 flex flex-col p-6 h-full overflow-hidden">
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`p-1.5 rounded-lg shadow-sm transition-all duration-300 ${isProcessingActive ? `bg-${accentColor}-600 shadow-${accentColor}-500/50 scale-110` : isLight ? `bg-${accentColor}-500 text-white shadow-${accentColor}-200` : `bg-${accentColor}-500 shadow-${accentColor}-500/20`} ${isCardHovered ? 'rotate-3 scale-110' : ''}`}>
                                        <FileUp size={16} className={`text-white ${isProcessingActive ? 'animate-bounce' : ''}`} />
                                    </div>
                                    <h3 className={`font-bold text-lg tracking-tight transition-all duration-300 ${textPrimary} ${isProcessingActive ? 'neon-text' : ''} ${isCardHovered ? 'premium-text-gradient' : ''}`} style={isProcessingActive ? { textShadow: `0 0 10px ${themeColorHex}` } : {}}>
                                        {isProcessingActive ? 'HYPER-SPEED UPLOAD' : 'Upload Center'}
                                    </h3>
                                </div>
                                <p className={`text-xs font-medium transition-colors duration-300 ${textSecondary} ${isCardHovered ? `text-${accentColor}-500/80` : ''}`}>
                                    {isProcessingActive ? 'Processing at max velocity...' : 'Drag & Drop resumes to analyze'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end group/counter">
                                <span className={`text-3xl font-black leading-none tracking-tighter transition-all duration-300 ${isProcessingActive ? `text-${accentColor}-500 scale-110` : textPrimary} ${isCardHovered ? `text-${accentColor}-500 scale-110 drop-shadow-lg` : ''}`}>{pendingFiles.length}</span>
                                <span className={`text-[10px] uppercase font-bold tracking-widest transition-all duration-300 ${textSecondary} ${isCardHovered ? `text-${accentColor}-400` : ''}`}>Pending</span>
                            </div>
                        </div>

                        {pendingFiles.length === 0 ? (
                            <div
                                onClick={() => !isReadOnly && fileInputRef.current?.click()}
                                className={`flex-1 rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-4 group min-h-[250px] ${isLight ? 'border-slate-200 hover:border-brand-400 hover:bg-slate-50' : 'border-white/10 hover:border-brand-500/50 hover:bg-white/5'} ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''} ${isCardHovered ? `border-${accentColor}-400/50 bg-${accentColor}-500/5` : ''}`}
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 border relative ${isLight ? 'bg-white border-slate-100 text-slate-400' : 'bg-white/5 border-white/10 text-zinc-500'} ${isCardHovered ? `scale-110 border-${accentColor}-400 text-${accentColor}-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]` : ''}`}>
                                    <div className={`absolute inset-0 rounded-full border border-${accentColor}-500/30 scale-110 opacity-0 transition-all duration-500 ${isCardHovered ? 'scale-125 opacity-100 animate-pulse' : ''}`}></div>
                                    <Upload size={32} className={`transition-transform duration-500 ${isCardHovered ? 'animate-bounce' : ''}`} />
                                </div>
                                <div className="text-center relative z-10">
                                    <p className={`font-bold text-sm transition-colors duration-300 ${textPrimary} ${isCardHovered ? `text-${accentColor}-500` : ''}`}>Click to Browse</p>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${textSecondary} ${isCardHovered ? `text-${accentColor}-400/70` : ''}`}>or drag files here</p>
                                    <p className={`text-[10px] mt-2 opacity-50 transition-opacity duration-300 ${isCardHovered ? 'opacity-100' : ''}`}>
                                        <span className="font-mono bg-black/10 px-1 py-0.5 rounded mr-1">CTRL+V</span> to paste files
                                    </p>
                                </div>
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            folderInputRef.current?.click();
                                        }}
                                        className={`p-2 rounded-lg bg-${accentColor}-500/10 hover:bg-${accentColor}-500/20 text-${accentColor}-500 text-xs font-bold flex items-center gap-1 transition-colors`}
                                        title="Upload entire folder"
                                    >
                                        <FolderUp size={14} />
                                        <span>Folder</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                ref={pendingListRef}
                                className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0"
                                onScroll={handlePendingScroll}
                                style={{ position: 'relative' }}
                            >
                                {/* Virtualized Upload List */}
                                <div style={{ height: totalPendingHeight, position: 'relative' }}>
                                    {visiblePending.map(({ index, offsetTop }) => {
                                        const f = pendingFiles[index];
                                        const isProcessing = processingFileIds.has(f.id);
                                        const isAnimatingOut = animatingOutFileIds.has(f.id);

                                        return (
                                            <div
                                                key={f.id}
                                                style={{
                                                    position: 'absolute',
                                                    top: offsetTop,
                                                    left: 0,
                                                    width: '100%',
                                                    height: PENDING_ITEM_HEIGHT - 8,
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    opacity: isAnimatingOut ? 0 : 1,
                                                    transform: isAnimatingOut ? 'translateX(100%)' : (isProcessing ? 'translateX(2px)' : 'translateX(0)')
                                                }}
                                                className={`group relative flex items-center p-3 rounded-xl border backdrop-blur-sm transition-all item-enter electric-hover ${isProcessing
                                                    ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20 neon-border'
                                                    : isLight ? 'bg-white/60 border-slate-100 hover:bg-white' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                    } ${isAnimatingOut ? 'processed' : ''}`}
                                            >
                                                {/* Outbound Animation for Processed Files */}
                                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-blue-500/50 origin-left scale-x-0 group-[.processed]:animate-removal-progress"></div>

                                                {/* Processing Glow Effect */}
                                                {isProcessing && (
                                                    <div className="absolute inset-0 bg-blue-400/5 animate-pulse rounded-xl overflow-hidden pointer-events-none">
                                                        <div className="absolute top-0 left-0 w-full h-[150%] bg-gradient-to-b from-blue-500/20 via-transparent to-transparent -translate-y-full animate-[scan-vertical_2s_linear_infinite]"></div>
                                                    </div>
                                                )}

                                                <div className="flex-shrink-0 mr-3 relative z-10">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${isProcessing
                                                        ? 'bg-blue-500 border-blue-400 text-white shadow-blue-500/50 shadow-md scale-110 animate-pulse'
                                                        : isLight ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/5 border-white/5 text-zinc-400'
                                                        }`}>
                                                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <FileText size={14} />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className={`text-xs font-bold truncate pr-6 transition-colors ${isProcessing ? 'text-blue-400 neon-text' : `${textPrimary} group-hover:text-blue-400`}`}>{f.candidateName}</div>
                                                    <div className={`text-[10px] flex items-center gap-1 ${textSecondary}`}>
                                                        <span>{f.size}</span>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-zinc-400"></span>
                                                        <span className={`font-bold ${isProcessing ? 'text-blue-400 neon-text' : `text-${accentColor}-500`}`}>
                                                            {isProcessing ? '⚡ Analyzing...' : 'Ready'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onRemoveFile(f.id); }}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20 ${isLight
                                                        ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 hover:shadow-sm'
                                                        : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_10px_rgba(248,113,113,0.5)]'
                                                        }`}
                                                    title={isProcessing ? "Cancel" : "Remove"}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className={`mt-6 pt-4 border-t shrink-0 space-y-3 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                            <button
                                onClick={triggerIgnite}
                                disabled={isUploading || isReadOnly || pendingFiles.length === 0 || isProcessingActive}
                                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] relative overflow-hidden group ${isUploading || isProcessingActive
                                    ? `bg-zinc-900/90 backdrop-blur-md text-${accentColor}-400 cursor-progress border border-${accentColor}-500/50 shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                                    : pendingFiles.length === 0
                                        ? isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : `bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]`
                                    }`}
                            >
                                {/* Button Shine Effect */}
                                {!isUploading && !isProcessingActive && pendingFiles.length > 0 && (
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                                )}

                                {/* Processing Background Effect */}
                                {(isUploading || isProcessingActive) && (
                                    <>
                                        <div className={`absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,theme('colors.${accentColor}.500')_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_linear_infinite]`}></div>
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                    </>
                                )}

                                <span className="relative flex items-center gap-2 z-20">
                                    {isUploading || isProcessingActive ? (
                                        <>
                                            <Loader2 className={`animate-spin text-${accentColor}-500`} size={18} />
                                            <span className={`font-mono tracking-wider font-bold ${isProcessingActive ? `text-${accentColor}-400 animate-pulse` : 'text-zinc-400'}`}>
                                                {isProcessingActive ? '⚡ SYSTEM OVERDRIVE' : 'INITIALIZING...'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} className={pendingFiles.length > 0 ? "fill-current animate-pulse" : ""} />
                                            {pendingFiles.length > 0 ? `IGNITE ANALYSIS (${pendingFiles.length})` : 'Start AI Analysis'}
                                        </>
                                    )}
                                </span>
                            </button>

                            {!isReadOnly && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full py-2.5 text-xs font-bold transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    Add More Files
                                </button>
                            )}
                        </div>
                    </div>

                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleInputFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={isReadOnly}
                    />
                    <input
                        type="file"
                        ref={folderInputRef}
                        className="hidden"
                        {...{ webkitdirectory: "", directory: "" } as any}
                        onChange={handleInputFileChange}
                    />
                </div>

                {/* Enhanced Failed Section */}
                {failedFiles.length > 0 && (
                    <div className={`absolute left-0 right-0 top-[calc(100%+1rem)] z-50 shadow-xl rounded-2xl border flex flex-col overflow-hidden max-h-[300px] shrink-0 ${isLight ? 'bg-rose-50 border-rose-100' : 'bg-rose-500/5 border-rose-500/10'}`}>
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setShowFailedDetails(!showFailedDetails)}
                        >
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={18} className="text-rose-500" />
                                <div>
                                    <h4 className="text-xs font-bold text-rose-500">Processing Failed ({failedFiles.length})</h4>
                                    <p className={`text-[10px] ${isLight ? 'text-rose-400' : 'text-rose-400/80'}`}>
                                        {showFailedDetails ? 'Click to collapse' : 'Click to review errors'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-rose-400">{showFailedDetails ? <X size={16} /> : <AlertCircle size={16} />}</div>
                        </div>

                        {showFailedDetails && (
                            <div className={`overflow-y-auto custom-scrollbar p-2 space-y-1 border-t ${isLight ? 'border-rose-100 bg-white/50' : 'border-rose-500/10 bg-black/20'}`}>
                                {failedFiles.map(file => (
                                    <div key={file.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${isLight ? 'hover:bg-rose-100/50' : 'hover:bg-rose-500/10'}`}>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className={`font-bold truncate ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{file.name}</div>
                                            <div className="text-rose-500 text-[10px]">{file.failureReasons?.[0] || 'Unknown Error'}</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRetryFile(file.id); }}
                                                className={`p-1.5 rounded hover:bg-rose-500 hover:text-white transition-colors ${isLight ? 'text-rose-500 bg-white shadow-sm border border-rose-100' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}
                                                title="Retry"
                                            >
                                                <RotateCcw size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                                                className={`p-1.5 rounded hover:bg-slate-500 hover:text-white transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-zinc-500 hover:bg-white/10'}`}
                                                title="Dismiss"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- RIGHT PANEL: Candidates List --- */}
            <div className={`flex-[2] flex flex-col h-full rounded-[2rem] border shadow-sm overflow-hidden min-w-0 relative ${cardBg}`}>

                {/* Toolbar */}
                <div className={`p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'}`}>
                    <div className="flex flex-1 gap-2 w-full">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                            <input
                                type="text"
                                placeholder="Search candidates..."
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
                                <option value="SCORE_DESC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Best Match</option>
                                <option value="SCORE_ASC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Lowest Match</option>
                                <option value="DATE_DESC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Newest</option>
                                <option value="DATE_ASC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Oldest</option>
                                <option value="NAME_ASC" className={isLight ? 'bg-white' : 'bg-[#18181b]'}>Name (A-Z)</option>
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
                                        {/* Scanner Filter Removed as we only show own uploads */}

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

                                        {(activeFiltersCount > 0 || searchQuery) && (
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

                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsExportMenuOpen(!isExportMenuOpen); }}
                                disabled={isExporting || candidates.length === 0}
                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                Export
                            </button>

                            {isExportMenuOpen && (
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border z-30 animate-fade-in-up p-2 ${isLight ? 'bg-white border-slate-100 shadow-slate-200/50' : 'bg-[#18181b] border-white/10'}`}>
                                    <button
                                        onClick={handleExportCSV}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/5 text-zinc-300'}`}
                                    >
                                        <FileText size={14} />
                                        {t('candidateList.exportCSV')}
                                    </button>
                                    <button
                                        onClick={handleExportJSON}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/5 text-zinc-300'}`}
                                    >
                                        <Code size={14} />
                                        {t('candidateList.exportJSON')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Header */}
                <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b text-[10px] font-extrabold uppercase tracking-widest sticky top-[73px] z-10 ${isLight ? 'bg-white border-slate-100 text-slate-400' : 'bg-[#0e0e10] border-white/5 text-zinc-500'}`}>
                    <div className="col-span-1 text-center flex justify-center">Rank</div>
                    <div className="col-span-5">Candidate Profile</div>
                    <div className="col-span-3">Match Score</div>
                    <div className="col-span-3 text-right">Uploaded</div>
                </div>

                {/* Candidate List Component */}
                <div className="flex-1 min-h-0 relative">
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
                        isProcessing={isProcessingActive}
                    />
                </div>

                {/* Full Screen Drawer */}
                <CandidateDrawer
                    isOpen={!!selectedFile}
                    candidateId={selectedFile?.id || null}
                    onClose={() => setSelectedFile(null)}
                    hideCommunicationTab={true}
                />
            </div>
        </div>
    );
};

export default ResumesTab;
