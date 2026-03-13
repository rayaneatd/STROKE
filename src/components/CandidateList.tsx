import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectFile, User } from '../types';
import { useVirtualizer } from '../hooks/useVirtualizer';
import {
    Loader2, FileText, Clock, Calendar,
    Medal, Eye, MailCheck, FileCheck, FileEdit, Check, Star, XCircle, ThumbsDown, RotateCcw
} from 'lucide-react';

interface CandidateListProps {
    candidates: ProjectFile[];
    selectedFileId: string | null;
    onSelect: (file: ProjectFile) => void;
    currentUser: User;
    sortOption: string;
    isLight: boolean;
    accentColor: string;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    itemHeight?: number;
    containerHeight?: number;
    showScannedBy?: boolean;
    userMap?: Map<string, User>;
    showCheckboxes?: boolean;
    selectedIds?: Set<string>;
    onToggleSelect?: (id: string) => void;
    onToggleFavorite?: (id: string, current: boolean) => void;
    onUpdateStatus?: (id: string, status: string) => void;
    isProcessing?: boolean;
}

const CandidateList: React.FC<CandidateListProps> = ({
    candidates,
    selectedFileId,
    onSelect,
    currentUser,
    sortOption,
    isLight,
    accentColor,
    onScroll,
    itemHeight = 80,
    containerHeight,
    showScannedBy = false,
    userMap,
    showCheckboxes = false,
    selectedIds,
    onToggleSelect,
    onToggleFavorite,
    onUpdateStatus,
    isProcessing = false
}) => {
    const { t } = useTranslation();
    const textPrimary = isLight ? 'text-slate-900' : 'text-zinc-200';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    const containerRef = useRef<HTMLDivElement>(null);
    const [measuredHeight, setMeasuredHeight] = useState<number>(containerHeight || 600);

    useEffect(() => {
        if (containerHeight) {
            setMeasuredHeight(containerHeight);
            return;
        }

        const element = containerRef.current;
        if (!element) return;

        // Initial measurement
        setMeasuredHeight(element.clientHeight || 600);

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect) {
                    setMeasuredHeight(entry.contentRect.height);
                }
            }
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [containerHeight]);

    const effectiveContainerHeight = measuredHeight;

    const { visibleItems, totalHeight, onScroll: onVirtualScroll } = useVirtualizer({
        itemCount: candidates.length,
        itemHeight: itemHeight,
        containerHeight: effectiveContainerHeight,
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        onVirtualScroll(e);
        onScroll(e);
    };

    if (candidates.length === 0 && !isProcessing) {
        return (
            <div className={`flex flex-col items-center justify-center h-full min-h-[256px] ${textSecondary}`}>
                <FileText size={48} className="opacity-20 mb-3" />
                <p className="text-sm font-medium">{t('candidateList.noCandidates')}</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`flex-1 overflow-y-auto custom-scrollbar min-h-0 ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}`}
            onScroll={handleScroll}
            style={{ height: containerHeight ?? '100%', position: 'relative' }}
        >
            <div style={{ height: totalHeight + (isProcessing ? itemHeight * 2 : 0), position: 'relative' }}>
                {/* Real-time Skeleton for new arrivals */}
                {isProcessing && (
                    <>
                        {[0, 1].map(i => (
                            <div
                                key={`skeleton-${i}`}
                                style={{
                                    position: 'absolute',
                                    top: i * itemHeight,
                                    left: 0,
                                    width: '100%',
                                    height: itemHeight
                                }}
                                className={`grid ${showCheckboxes ? 'grid-cols-[40px_repeat(12,minmax(0,1fr))]' : 'grid-cols-12'} gap-4 px-6 py-3 border-b items-center animate-pulse opacity-50`}
                            >
                                <div className="col-span-1 flex justify-center">
                                    <div className={`w-6 h-6 rounded-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                </div>
                                <div className="col-span-11 flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className={`h-4 w-1/3 rounded mb-2 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                        <div className={`h-3 w-1/4 rounded ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}></div>
                                    </div>
                                    <div className={`h-8 w-24 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {visibleItems.map(({ index, offsetTop }) => {
                    const file = candidates[index];
                    if (!file) return null;
                    const topShift = isProcessing ? itemHeight * 2 : 0;

                    const hasScore = file.matchScore !== null && file.matchScore !== undefined;
                    const score = hasScore ? file.matchScore : 0;
                    const isTop = score >= 80;
                    const isMid = score >= 50 && score < 80;

                    const isExported = file.exportedBy?.includes(currentUser.id);
                    const isViewed = file.viewedBy?.includes(currentUser.id);
                    const isEmailed = !!file.emailSentAt;
                    const hasDraft = !!file.emailDraft;

                    const isSelected = selectedFileId === file.id;

                    // Rank Logic
                    const rank = file.rank;
                    let rankDisplay: React.ReactNode = '-';

                    if (rank !== undefined) {
                        if (rank === 1) {
                            rankDisplay = (
                                <div className="relative flex items-center justify-center w-10 h-8 mx-auto gap-1">
                                    <div className="absolute inset-y-0 left-1 w-6 h-6 bg-yellow-500/20 rounded-full blur-[2px]"></div>
                                    <div className="relative w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg border border-yellow-300/30">
                                        <Medal size={12} className="text-white fill-white/20" />
                                    </div>
                                    <span className={`${textPrimary} text-xs font-semibold`}>{rank}</span>
                                </div>
                            );
                        } else if (rank === 2) {
                            rankDisplay = (
                                <div className="relative flex items-center justify-center w-10 h-8 mx-auto gap-1">
                                    <div className="relative w-6 h-6 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center shadow-md border border-slate-300/30">
                                        <Medal size={12} className="text-white fill-white/20" />
                                    </div>
                                    <span className={`${textPrimary} text-xs font-semibold`}>{rank}</span>
                                </div>
                            );
                        } else if (rank === 3) {
                            rankDisplay = (
                                <div className="relative flex items-center justify-center w-10 h-8 mx-auto gap-1">
                                    <div className="relative w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-700 rounded-full flex items-center justify-center shadow-md border border-orange-300/30">
                                        <Medal size={12} className="text-white fill-white/20" />
                                    </div>
                                    <span className={`${textPrimary} text-xs font-semibold`}>{rank}</span>
                                </div>
                            );
                        } else {
                            rankDisplay = <span className={`font-mono font-bold ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>#{rank}</span>;
                        }
                    }

                    const scanner = showScannedBy && userMap ? userMap.get(file.uploadedByUserId || '') : null;

                    return (
                        <div
                            key={file.id}
                            style={{
                                position: 'absolute',
                                top: offsetTop + topShift,
                                left: 0,
                                width: '100%',
                                height: itemHeight
                            }}
                            onClick={() => onSelect(file)}
                            className={`grid ${showCheckboxes ? 'grid-cols-[40px_repeat(12,minmax(0,1fr))]' : 'grid-cols-12'} gap-4 px-6 py-3 border-b items-center transition-all duration-300 cursor-pointer group ${isSelected
                                ? `bg-${accentColor}-500/10 border-l-4 border-l-${accentColor}-500 ${isLight ? 'border-b-slate-100' : 'border-b-white/5'}`
                                : `border-l-4 border-l-transparent hover:bg-${accentColor}-500/5 ${isLight ? 'border-b-slate-50 hover:border-l-slate-300' : 'border-b-white/5 hover:border-l-zinc-700'}`
                                } ${file.status === 'rejected' ? 'opacity-40 grayscale-[0.8]' : ''}`}
                        >
                            {/* Checkbox for Bulk Actions */}
                            {showCheckboxes && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSelect && onToggleSelect(file.id);
                                    }}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${selectedIds?.has(file.id)
                                        ? `bg-${accentColor}-500 border-${accentColor}-500`
                                        : isLight ? 'border-slate-300 hover:border-slate-400' : 'border-zinc-700 hover:border-zinc-500'
                                        }`}
                                >
                                    {selectedIds?.has(file.id) && <Check size={12} className="text-white" />}
                                </div>
                            )}

                            {/* Rank Column */}
                            <div className="col-span-1 text-center flex justify-center">
                                {rankDisplay}
                            </div>
                            <div className={`${showScannedBy ? 'col-span-4' : 'col-span-5'} min-w-0`}>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-bold truncate ${isSelected ? `text-${accentColor}-500` : textPrimary}`}>{file.candidateName || 'Candidate'}</h4>
                                            <div className="flex -space-x-1">
                                                {isEmailed && (
                                                    <div className={`rounded-full p-0.5 shadow-sm border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/10'}`} title={t('candidateList.emailSent')}>
                                                        <MailCheck size={10} className="text-emerald-500" />
                                                    </div>
                                                )}
                                                {hasDraft && !isEmailed && showScannedBy && (
                                                    <div className={`rounded-full p-0.5 shadow-sm border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/10'}`} title={t('candidateList.draftReady')}>
                                                        <FileEdit size={10} className="text-purple-500" />
                                                    </div>
                                                )}
                                                {isExported && (
                                                    <div className={`rounded-full p-0.5 shadow-sm border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/10'}`} title={t('candidateList.exported')}>
                                                        <FileCheck size={10} className="text-blue-500" />
                                                    </div>
                                                )}
                                            </div>
                                            {isViewed && (
                                                <div title={t('candidateList.viewedByYou')}>
                                                    <Eye size={12} className={isLight ? "text-slate-400" : "text-zinc-400"} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${textSecondary}`}>
                                            <span className="truncate max-w-[150px] flex items-center gap-1">
                                                <FileText size={10} /> {file.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {showScannedBy && (
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
                                        <span className={`text-xs italic ${textSecondary}`}>{t('candidateList.unknownUser')}</span>
                                    )}
                                </div>
                            )}

                            {!showScannedBy && (
                                <div className="col-span-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-zinc-800'}`}>
                                            <div className={`h-full rounded-full ${isTop ? 'bg-emerald-500' : isMid ? 'bg-blue-500' : 'bg-zinc-500'}`} style={{ width: `${score}%` }}></div>
                                        </div>
                                        <span className={`text-sm font-bold ${isTop ? 'text-emerald-500' : isMid ? 'text-blue-500' : textSecondary}`}>{score}%</span>
                                    </div>
                                </div>
                            )}

                            <div className={`${showScannedBy ? 'col-span-2' : 'col-span-3'} text-right text-xs font-medium ${textSecondary}`}>
                                {showScannedBy ? (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {new Date(file.uploadedAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5 opacity-70">
                                            <Clock size={12} />
                                            {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </>
                                ) : (
                                    new Date(file.uploadedAt).toLocaleDateString()
                                )}
                            </div>

                            {showScannedBy && (
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    {/* Favorite Button */}
                                    {onToggleFavorite && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(file.id, file.isFavorite || false);
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors ${file.isFavorite
                                                ? 'text-yellow-500 bg-yellow-500/10'
                                                : `text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10`
                                                }`}
                                            title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                        >
                                            <Star size={16} fill={file.isFavorite ? "currentColor" : "none"} />
                                        </button>
                                    )}

                                    {/* Reject / Undo Button */}
                                    {onUpdateStatus && (
                                        file.status === 'rejected' ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onUpdateStatus(file.id, 'new');
                                                }}
                                                className={`p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors`}
                                                title="Undo rejection"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onUpdateStatus(file.id, 'rejected');
                                                }}
                                                className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors`}
                                                title="Reject candidate"
                                            >
                                                <ThumbsDown size={16} />
                                            </button>
                                        )
                                    )}

                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${hasScore ? (score >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        score >= 50 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-500 border-zinc-700') : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}`}>
                                        {hasScore ? `${score}%` : '--'}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CandidateList;
