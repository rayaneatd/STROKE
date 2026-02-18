import React, { useMemo } from 'react';
import { User, Project } from '../../types';
import { useCandidates } from '../../hooks/useCandidates';
import {
    Activity, Ghost,
    User as UserIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActivityTabProps {
    project: Project;
    riskCount: number;
    contributionData: { userId: string; scans: number }[];
    canUseAntiGhosting: boolean;
    onMarkContacted?: (fileId: string) => void;
    onMarkViewed?: (fileId: string) => void;
    onMarkExported?: (fileId: string) => void;
    onBatchUpdate?: (updates: { id: string, changes: Partial<any> }[]) => void; // Changed ProjectFile to any to avoid import or just keep it if imported
    currentUser: User;
}

const ActivityTab: React.FC<ActivityTabProps> = ({
    project,
    riskCount,
    contributionData,
    currentUser
}) => {
    const { t } = useTranslation();

    // Theme Helpers
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';

    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    
    // --- Server-side Data Fetching (Only for stats now) ---
    const { 
        totalCount: totalScans
    } = useCandidates({
        projectId: project.id,
        userId: currentUser.id,
        searchQuery: '',
        sortOption: 'DATE_DESC',
        filterScores: [],
        filterActivities: [],
        filterUploaders: [],
        status: ['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED']
    });

    const uniqueScanners = contributionData.length;

    return (
        <div className="space-y-6 animate-fade-in relative flex flex-col">
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
                        </div>
                        <div className={`text-xs ${textSecondary} font-medium uppercase tracking-wide`}>At Risk (Uncontacted)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityTab;
