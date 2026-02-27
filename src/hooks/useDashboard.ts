import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Role, DashboardAnalytics, Project, ProjectFile, ProjectPerformanceRow, TimelineDataPoint } from '../types';
import { supabase } from '../lib/supabase';

interface UseDashboardProps {
    currentUser: User;
}

export const useDashboard = ({ currentUser }: UseDashboardProps) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardAnalytics | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);

    // Filter State
    const [timeRange, setTimeRange] = useState<number | 'all'>(14);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'>('ALL');
    const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'ME'>(currentUser.role === Role.ADMIN ? 'ALL' : 'ME');

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchData = useCallback(async () => {
        if (!currentUser.id) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            // 1. Fetch Projects for the user
            console.log("Fetching projects for user:", currentUser.id);
            let projectQuery = supabase
                .from('projects')
                .select(`
                    *,
                    members:project_members!inner(*)
                `);

            if (ownerFilter === 'ME') {
                projectQuery = projectQuery.eq('owner_id', currentUser.id);
            } else {
                projectQuery = projectQuery.eq('project_members.user_id', currentUser.id);
            }

            if (statusFilter !== 'ALL') {
                projectQuery = projectQuery.eq('status', statusFilter);
            }

            const { data: projectsData, error: projectsError } = await projectQuery;
            if (projectsError) {
                console.error("Projects fetch error:", projectsError);
                throw projectsError;
            }
            console.log("Projects fetched:", projectsData?.length);

            // 2. Fetch Candidates for these projects
            const projectIds = (projectsData || []).map(p => p.id);
            let candidatesData: any[] | null = [];
            let failEvents: any[] | null = [];

            if (projectIds.length > 0) {
                console.log("Fetching candidates for projects:", projectIds.length);
                const { data: cData, error: candidatesError } = await supabase
                    .from('candidates')
                    .select('*')
                    .in('project_id', projectIds);

                if (candidatesError) {
                    console.error("Candidates fetch error:", candidatesError);
                    throw candidatesError;
                }
                candidatesData = cData;
                console.log("Candidates fetched:", candidatesData?.length);

                // 3. Fetch Fail Events
                console.log("Fetching fail events...");
                const { data: fData, error: failEventsError } = await supabase
                    .from('analytics_events')
                    .select('*')
                    .eq('event_type', 'FAIL')
                    .in('project_id', projectIds);

                if (failEventsError) {
                    console.error("Fail events fetch error:", failEventsError);
                    throw failEventsError;
                }
                failEvents = fData;
                console.log("Fail events fetched:", failEvents?.length);
            } else {
                console.log("No projects found, skipping candidate/event fetch");
            }

            // 4. Aggregate Data
            let candidates = (candidatesData || []) as any[];
            let events = (failEvents || []) as any[];

            // Apply Time Range Filter
            const now = new Date();
            let startDate: Date;
            let daysToLookBack: number;

            if (timeRange === 'all') {
                // Find the earliest date in candidates and events
                if (candidates.length > 0 || events.length > 0) {
                    const candidateDates = candidates.map(c => new Date(c.uploaded_at || c.created_at).getTime());
                    const eventDates = events.map(e => new Date(e.created_at).getTime());
                    const allDates = [...candidateDates, ...eventDates];
                    const minDate = Math.min(...allDates);
                    startDate = new Date(minDate);
                    // Calculate days difference
                    const diffTime = Math.abs(now.getTime() - startDate.getTime());
                    daysToLookBack = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    // Add a buffer day to ensure we cover everything
                    daysToLookBack += 1;
                } else {
                    startDate = new Date();
                    daysToLookBack = 1;
                }
            } else {
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - timeRange);
                daysToLookBack = timeRange;
            }

            // Filter candidates by date
            candidates = candidates.filter(c => {
                const cDate = new Date(c.uploaded_at || c.created_at);
                return cDate >= startDate;
            });

            // Filter events by date
            events = events.filter(e => {
                const eDate = new Date(e.created_at);
                return eDate >= startDate;
            });

            const completedCandidates = candidates.filter(c => c.match_score != null);
            const qualifiedCandidates = completedCandidates.filter(c => (c.match_score || 0) >= 80);

            // New Status Logic
            const newCount = candidates.filter(c => c.status === 'new' || !c.status).length;
            const rejectedCount = candidates.filter(c => c.status === 'rejected').length;

            // Process Fail Reasons
            const failReasonsMap = new Map<string, number>();
            events.forEach(e => {
                const rawReason = (e.metadata?.reason || '').toLowerCase();
                let label = t('dashboard.failReasons.unknown');

                if (rawReason.includes('upload') || rawReason.includes('storage')) {
                    label = t('dashboard.failReasons.uploadFailed');
                } else if (rawReason.includes('pdf') || rawReason.includes('format') || rawReason.includes('type')) {
                    label = t('dashboard.failReasons.invalidFormat');
                } else if (rawReason.includes('too_many_pages') || rawReason.includes('pages')) {
                    label = t('dashboard.failReasons.tooManyPages');
                } else if (rawReason.includes('corruption') || rawReason.includes('corrupt')) {
                    label = t('dashboard.failReasons.corruption');
                } else if (rawReason.includes('validation')) {
                    label = t('dashboard.failReasons.validationFailed');
                } else {
                    // If no match found, check if rawReason itself is a translation key or use it directly if meaningful
                    // For now, default to unknown to ensure clean UI
                    label = t('dashboard.failReasons.unknown');
                }

                failReasonsMap.set(label, (failReasonsMap.get(label) || 0) + 1);
            });

            // Color palette for error types
            const errorColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#6366f1'];

            const errorData = Array.from(failReasonsMap.entries()).map(([name, value], index) => ({
                name,
                value,
                fill: errorColors[index % errorColors.length]
            }));

            // Timeline Calculation
            const timelineMap = new Map<string, { total: number, scoreSum: number, count: number, dateObj: Date, qualified: number, failed: number }>();

            for (let i = 0; i < daysToLookBack; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const isoDate = d.toISOString().split('T')[0];
                timelineMap.set(isoDate, { total: 0, scoreSum: 0, count: 0, dateObj: d, qualified: 0, failed: 0 });
            }

            candidates.forEach(c => {
                const cDate = new Date(c.uploaded_at || c.created_at);
                const isoDate = cDate.toISOString().split('T')[0];
                if (timelineMap.has(isoDate)) {
                    const stats = timelineMap.get(isoDate)!;
                    stats.total++;
                    if (c.match_score) {
                        stats.scoreSum += c.match_score;
                        stats.count++;
                        if (c.match_score >= 80) stats.qualified++;
                    }
                }
            });

            events.forEach(e => {
                const eDate = new Date(e.created_at);
                const isoDate = eDate.toISOString().split('T')[0];
                if (timelineMap.has(isoDate)) {
                    const stats = timelineMap.get(isoDate)!;
                    stats.failed++;
                }
            });

            const timelineData: TimelineDataPoint[] = Array.from(timelineMap.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([_, stats]) => ({
                    date: stats.dateObj.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: daysToLookBack > 365 ? '2-digit' : undefined
                    }),
                    applications: stats.total,
                    avgQuality: stats.count > 0 ? Math.round(stats.scoreSum / stats.count) : 0,
                    qualified: stats.qualified,
                    failed: stats.failed
                }));

            // Team Stats - Deduplication per Role Category
            const adminIds = new Set<string>();
            const partnerIds = new Set<string>();
            const scoutIds = new Set<string>();
            const analystIds = new Set<string>();

            projectsData.forEach(p => {
                p.members?.forEach((m: any) => {
                    // Check role in this specific project context
                    if (m.role === 'ADMIN') {
                        adminIds.add(m.user_id);
                    } else if (m.role === 'EMPLOYEE') {
                        if (m.permissions.includes('SCAN') && m.permissions.includes('ANALYZE')) {
                            partnerIds.add(m.user_id);
                        } else if (m.permissions.includes('SCAN')) {
                            scoutIds.add(m.user_id);
                        } else if (m.permissions.includes('ANALYZE')) {
                            analystIds.add(m.user_id);
                        }
                    }
                });
            });

            const roleCounts = {
                admins: adminIds.size,
                partners: partnerIds.size,
                scouts: scoutIds.size,
                analysts: analystIds.size
            };

            const analytics: DashboardAnalytics = {
                kpi: {
                    totalCandidates: candidates.length,
                    candidateTrend: '+0%', // Dynamic trend would need historical query
                    analyzedCount: completedCandidates.length,
                    qualifiedRate: candidates.length > 0 ? Math.round((qualifiedCandidates.length / candidates.length) * 100) : 0,
                    qualifiedTrend: 'Stable',
                    activeProjects: projectsData.filter(p => p.status === 'ACTIVE').length,
                    avgTimeProcessing: '0m 45s',
                    failedUploadsCount: 0,
                    // NEW KPIs
                    rejectedCount
                },
                teamStats: roleCounts,
                timelineData,
                statusDistribution: [
                    { name: 'New', value: newCount, fill: '#f59e0b' }, // amber-500
                    { name: 'Rejected', value: rejectedCount, fill: '#ef4444' } // rose-500
                ],
                errorData,
                projectPerformance: projectsData.map(p => {
                    const pCandidates = candidates.filter(c => c.project_id === p.id);
                    const pCompleted = pCandidates.filter(c => c.match_score != null);
                    return {
                        id: p.id,
                        name: p.title,
                        status: p.status as any,
                        candidates: pCandidates.length,
                        qualified: pCandidates.filter(c => (c.match_score || 0) >= 80).length,
                        avgScore: pCompleted.length ? Math.round(pCompleted.reduce((acc, c) => acc + (c.match_score || 0), 0) / pCompleted.length) : 0
                    } as ProjectPerformanceRow;
                })
            };

            if (isMounted.current) {
                setData(analytics);
                setLoading(false);
            }
        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            if (isMounted.current) {
                setLoading(false);
                setError(err.message || 'Unknown error');
            }
        }
    }, [timeRange, statusFilter, ownerFilter, currentUser.id]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchData();
    }, [fetchData, refreshKey]);

    const handleManualRefresh = () => {
        if (loading) return;
        setRefreshKey(prev => prev + 1);
    };

    const handleExport = (format: 'CSV' | 'JSON') => {
        console.log(`Exporting ${format}...`);
        setExportMenuOpen(false);
    };

    const totalErrors = data?.errorData?.reduce((a: any, b: any) => a + b.value, 0) || 0;
    const failedFileCount = data?.kpi.failedUploadsCount || 0;
    const totalApplications = data?.kpi.totalCandidates || 1;
    const errorRate = ((failedFileCount / totalApplications) * 100).toFixed(1);

    return {
        loading,
        error,
        data,
        exportMenuOpen,
        setExportMenuOpen,
        timeRange,
        setTimeRange,
        statusFilter,
        setStatusFilter,
        ownerFilter,
        setOwnerFilter,
        handleManualRefresh,
        handleExport,
        totalErrors,
        failedFileCount,
        errorRate
    };
};
