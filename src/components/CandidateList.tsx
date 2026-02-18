import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectFile, User } from '../types';
import { useVirtualizer } from '../hooks/useVirtualizer';
import {
    Loader2, FileText, Clock, Calendar,
    Medal, Eye, MailCheck, FileCheck, FileEdit
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
    userMap
}) => {
    const { t } = useTranslation();
    const textPrimary = isLight ? 'text-slate-900' : 'text-zinc-200';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    const effectiveContainerHeight = containerHeight ?? 600;

    const { visibleItems, totalHeight, onScroll: onVirtualScroll } = useVirtualizer({
        itemCount: candidates.length,
        itemHeight: itemHeight,
        containerHeight: effectiveContainerHeight,
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        onVirtualScroll(e);
        onScroll(e);
    };

    if (candidates.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-64 ${textSecondary}`}>
                <FileText size={48} className="opacity-20 mb-3" />
                <p className="text-sm font-medium">{t('candidateList.noCandidates')}</p>
            </div>
        );
    }

    return (
        <div
            className={`flex-1 overflow-y-auto custom-scrollbar min-h-0 ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}`}
            onScroll={handleScroll}
            style={{ height: containerHeight ?? '100%', position: 'relative' }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ index, offsetTop }) => {
                    const file = candidates[index];
                    if (!file) return null;

                    const hasScore = file.score !== null && file.score !== undefined;
                    const score = hasScore ? file.score : 0;
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
                                top: offsetTop,
                                left: 0,
                                width: '100%',
                                height: itemHeight
                            }}
                            onClick={() => onSelect(file)}
                            className={`grid grid-cols-12 gap-4 px-6 md:px-8 items-center transition-colors group cursor-pointer border-b ${
                                isLight ? 'border-slate-50 hover:bg-slate-50' : 'border-white/5 hover:bg-white/5'
                            } ${isSelected ? (isLight ? `bg-${accentColor}-50` : 'bg-brand-500/10') : ''}`}
                        >
                            <div className="col-span-1 text-center flex justify-center text-xs">
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
                                <div className="col-span-2 text-right">
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
