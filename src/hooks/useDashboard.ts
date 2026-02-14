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
    const [timeRange, setTimeRange] = useState<number>(14);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'>('ALL');
    const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'ME'>(currentUser.role === Role.ADMIN ? 'ALL' : 'ME');

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchData = useCallback(async () => {
        if (!currentUser.id) return;

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

            // 3. Aggregate Data
            const candidates = (candidatesData || []) as any[];
            const completedCandidates = candidates.filter(c => c.status === 'COMPLETED');
            const qualifiedCandidates = completedCandidates.filter(c => (c.score || 0) >= 80);

            // Timeline Calculation
            const timelineMap = new Map<string, { total: number, scoreSum: number, count: number }>();
            const now = new Date();
            for (let i = 0; i < timeRange; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dateKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                timelineMap.set(dateKey, { total: 0, scoreSum: 0, count: 0 });
            }

            candidates.forEach(c => {
                const dateKey = new Date(c.uploaded_at || c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                if (timelineMap.has(dateKey)) {
                    const stats = timelineMap.get(dateKey)!;
                    stats.total++;
                    if (c.score) {
                        stats.scoreSum += c.score;
                        stats.count++;
                    }
                }
            });

            const timelineData: TimelineDataPoint[] = Array.from(timelineMap.entries())
                .map(([date, stats]) => ({
                    date,
                    applications: stats.total,
                    avgQuality: stats.count > 0 ? Math.round(stats.scoreSum / stats.count) : 0
                }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Team Stats
            const roleCounts = { admins: 0, partners: 0, scouts: 0, analysts: 0 };
            const uniqueUsers = new Set<string>();
            projectsData.forEach(p => {
                p.members?.forEach((m: any) => {
                    if (!uniqueUsers.has(m.user_id)) {
                        uniqueUsers.add(m.user_id);
                        if (m.role === 'ADMIN') roleCounts.admins++;
                        else if (m.role === 'PARTNER') roleCounts.partners++;
                        else if (m.role === 'SCOUT') roleCounts.scouts++;
                        else if (m.role === 'ANALYST') roleCounts.analysts++;
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
                    failedUploadsCount: candidates.filter(c => c.status === 'FAILED').length
                },
                teamStats: roleCounts,
                timelineData,
                errorData: [
                    { name: 'Missing Data', value: candidates.filter(c => c.status === 'FAILED' && !c.candidate_name).length, fill: '#6366f1' },
                    { name: 'Low Score', value: completedCandidates.filter(c => (c.score || 0) < 40).length, fill: '#ef4444' },
                    { name: 'Pending', value: candidates.filter(c => c.status === 'PENDING').length, fill: '#f59e0b' }
                ],
                projectPerformance: projectsData.map(p => {
                    const pCandidates = candidates.filter(c => c.project_id === p.id);
                    const pCompleted = pCandidates.filter(c => c.status === 'COMPLETED');
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
