import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Role, DashboardAnalytics, Project, ProjectFile, ProjectPerformanceRow, TimelineDataPoint } from '../types';
import { supabase } from '../lib/supabase';

interface UseDashboardProps {
    currentUser: User;
}

export const useDashboard = ({ currentUser }: UseDashboardProps) => {
    const [loading, setLoading] = useState(true);
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
            // 1. Fetch Projects for the user
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
            if (projectsError) throw projectsError;

            // 2. Fetch Candidates for these projects
            const projectIds = projectsData.map(p => p.id);
            const { data: candidatesData, error: candidatesError } = await supabase
                .from('candidates')
                .select('*')
                .in('project_id', projectIds);

            if (candidatesError) throw candidatesError;

            // 3. Fetch Fail Events
            const { data: failEvents, error: failEventsError } = await supabase
                .from('analytics_events')
                .select('*')
                .eq('event_type', 'FAIL')
                .in('project_id', projectIds);
            
            if (failEventsError) throw failEventsError;

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

            const completedCandidates = candidates.filter(c => c.score != null);
            const qualifiedCandidates = completedCandidates.filter(c => (c.score || 0) >= 80);
            
            // New Status Logic
            const newCount = candidates.filter(c => c.status === 'new' || !c.status).length;
            const rejectedCount = candidates.filter(c => c.status === 'rejected').length;

            // Process Fail Reasons
            const failReasonsMap = new Map<string, number>();
            events.forEach(e => {
                const reason = e.metadata?.reason || 'Unknown Error';
                failReasonsMap.set(reason, (failReasonsMap.get(reason) || 0) + 1);
            });

            // Color palette for error types
            const errorColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#6366f1'];
            
            const errorData = Array.from(failReasonsMap.entries()).map(([name, value], index) => ({
                name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                value,
                fill: errorColors[index % errorColors.length]
            }));

            // Timeline Calculation
            const timelineMap = new Map<string, { total: number, scoreSum: number, count: number, dateObj: Date }>();
            
            for (let i = 0; i < daysToLookBack; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const isoDate = d.toISOString().split('T')[0];
                timelineMap.set(isoDate, { total: 0, scoreSum: 0, count: 0, dateObj: d });
            }

            candidates.forEach(c => {
                const cDate = new Date(c.uploaded_at || c.created_at);
                const isoDate = cDate.toISOString().split('T')[0];
                if (timelineMap.has(isoDate)) {
                    const stats = timelineMap.get(isoDate)!;
                    stats.total++;
                    if (c.score) {
                        stats.scoreSum += c.score;
                        stats.count++;
                    }
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
                    avgQuality: stats.count > 0 ? Math.round(stats.scoreSum / stats.count) : 0
                }));

            // Team Stats
            const roleCounts = { admins: 0, partners: 0, scouts: 0, analysts: 0 };
            const uniqueUsers = new Set<string>();
            projectsData.forEach(p => {
                p.members?.forEach((m: any) => {
                    if (!uniqueUsers.has(m.user_id)) {
                        uniqueUsers.add(m.user_id);
                        // Correct Role Logic based on permissions
                        if (m.role === 'ADMIN' || m.role === 'OWNER') {
                            roleCounts.admins++;
                        } else if (m.role === 'EMPLOYEE') {
                            if (m.permissions.includes('SCAN') && m.permissions.includes('ANALYZE')) roleCounts.partners++;
                            else if (m.permissions.includes('SCAN')) roleCounts.scouts++;
                            else if (m.permissions.includes('ANALYZE')) roleCounts.analysts++;
                        }
                    }
                });
            });

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
                    const pCompleted = pCandidates.filter(c => c.score != null);
                    return {
                        id: p.id,
                        name: p.title,
                        status: p.status as any,
                        candidates: pCandidates.length,
                        qualified: pCandidates.filter(c => (c.score || 0) >= 80).length,
                        avgScore: pCompleted.length ? Math.round(pCompleted.reduce((acc, c) => acc + (c.score || 0), 0) / pCompleted.length) : 0
                    } as ProjectPerformanceRow;
                })
            };

            if (isMounted.current) {
                setData(analytics);
                setLoading(false);
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            if (isMounted.current) setLoading(false);
        }
    }, [timeRange, statusFilter, ownerFilter, currentUser.id]);

    useEffect(() => {
        setLoading(true);
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
