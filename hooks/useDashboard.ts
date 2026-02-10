import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Role, DashboardAnalytics } from '../types';
import { getAdvancedDashboardAnalytics, generateReport, AnalyticsOptions } from '../services/mockData';

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

    // Core Data Fetching Logic
    const fetchData = useCallback(() => {
        const options: AnalyticsOptions = {
            timeRangeDays: timeRange,
            projectStatus: statusFilter,
            ownerFilter: ownerFilter,
            currentUserId: currentUser.id
        };

        // Artificial delay to visualize refresh
        setTimeout(() => {
            const analytics = getAdvancedDashboardAnalytics(options);
            if (isMounted.current) {
                setData(analytics);
                setLoading(false);
            }
        }, 400);

    }, [timeRange, statusFilter, ownerFilter, currentUser.id]);

    useEffect(() => {
        setLoading(true);
        fetchData();

        // Auto-refresh interval (polling)
        const interval = setInterval(() => {
            const options: AnalyticsOptions = {
                timeRangeDays: timeRange,
                projectStatus: statusFilter,
                ownerFilter: ownerFilter,
                currentUserId: currentUser.id
            };
            const analytics = getAdvancedDashboardAnalytics(options);
            if (isMounted.current) {
                setData(analytics);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [fetchData, refreshKey]);

    const handleManualRefresh = () => {
        if (loading) return;
        setLoading(true);
        setRefreshKey(prev => prev + 1);
    };

    const handleExport = (format: 'CSV' | 'JSON') => {
        const url = generateReport(format, 'GLOBAL');
        const a = document.createElement('a');
        a.href = url;
        a.download = `airecruit_analytics_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportMenuOpen(false);
    };

    // Derived Data
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
