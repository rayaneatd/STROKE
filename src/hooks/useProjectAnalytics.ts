import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { startOfDay, subDays, isAfter, parseISO } from 'date-fns';

export type TimeRange = '7d' | '30d' | '90d' | 'ALL';

interface ProjectAnalytics {
    total: number;
    completed: number;
    pending: number;
    qualified: number; // Score >= 50
    contacted: number; // Email sent
    rejected: number; // Score < 50
    avgScore: number;

    // Rates
    qualificationRate: number;
    contactRate: number;
    completionRate: number;

    // Charts
    timelineData: {
        date: string;
        added: number;
        qualified: number;
        contacted: number;
        failed: number;
        avgScore: number;
    }[];

    scoreDistribution: { range: string; count: number }[];
    failureDistribution: { reason: string; count: number }[];

    funnelData: { stage: string; count: number; fill: string }[];

    contributionData: {
        userId: string;
        scans: number;
        qualified: number;
        rejected: number;
        contacted: number;
    }[];

    topCandidates: { id: string; candidateName: string; score: number; uploadedAt: string }[];

    // Health
    recentFailures: number;
    riskCount: number;
    hiddenGemCount: number;
}

export const useProjectAnalytics = (projectId: string, timeRange: TimeRange = 'ALL') => {
    const { t, i18n } = useTranslation();

    return useQuery({
        queryKey: ['project-analytics', projectId, timeRange, i18n.language],
        queryFn: async (): Promise<ProjectAnalytics> => {
            // Calculate start date based on range
            let startDate: Date | null = null;
            const now = new Date();

            if (timeRange === '7d') startDate = subDays(now, 7);
            if (timeRange === '30d') startDate = subDays(now, 30);
            if (timeRange === '90d') startDate = subDays(now, 90);

            // Parallel requests:
            const [statsResult, eventsResult, timelineResult, failureDistResult, hiddenGemsRes] = await Promise.all([
                supabase
                    .from('candidates')
                    .select('id, candidate_name, match_score, recruiter_override_score, uploaded_at, uploaded_by, email_sent_at, size, status, is_hidden_gem')
                    .eq('project_id', projectId),
                supabase
                    .from('analytics_events')
                    .select('*')
                    .eq('project_id', projectId),
                supabase.rpc('get_project_activity_timeline' as any, {
                    p_project_id: projectId,
                    p_start_date: startDate ? startDate.toISOString() : null
                }),
                supabase.rpc('get_project_failure_distribution' as any, {
                    p_project_id: projectId,
                    p_start_date: startDate ? startDate.toISOString() : null
                }),
                supabase.rpc('get_project_hidden_gems_count' as any, {
                    p_project_id: projectId
                })
            ]);

            if (statsResult.error) throw statsResult.error;

            const hiddenGemsCount = Number(hiddenGemsRes.data || 0);

            // Filter by Date Range locally (Legacy stats)
            const allData = (statsResult.data || []).map((c: any) => ({
                ...c,
                match_score: c.recruiter_override_score != null ? c.recruiter_override_score : c.match_score
            }));
            const allEvents = eventsResult.data || [];

            const data = startDate
                ? allData.filter(c => isAfter(parseISO(c.uploaded_at), startDate))
                : allData;

            // Basic Stats
            const total = data.length;
            const completed = data.filter(c => c.match_score != null).length;

            const todayStart = startOfDay(new Date());
            const pending = data.filter(c => isAfter(parseISO(c.uploaded_at), todayStart)).length;
            const qualified = data.filter(c => c.match_score != null && c.match_score >= 50).length;
            const rejected = data.filter(c => c.status === 'rejected').length;
            const contacted = data.filter(c => c.email_sent_at != null).length;

            const scores = data
                .filter(c => c.match_score != null)
                .map(c => c.match_score as number);

            const avgScore = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;

            const qualificationRate = completed > 0 ? Math.round((qualified / completed) * 100) : 0;
            const contactRate = qualified > 0 ? Math.round((contacted / qualified) * 100) : 0;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Timeline
            let timelineData: any[] = [];
            if (timelineResult.data && Array.isArray(timelineResult.data) && timelineResult.data.length > 0) {
                timelineData = timelineResult.data.map((item: any) => ({
                    date: item.date,
                    added: Number(item.added || 0),
                    qualified: Number(item.qualified || 0),
                    failed: Number(item.failed || 0),
                    avgScore: Number(item.avg_score || 0)
                }));
            } else {
                const timelineMap = new Map<string, { added: number; qualified: number; contacted: number; rejected: number; failed: number }>();
                data.forEach(c => {
                    const date = c.uploaded_at.split('T')[0];
                    const current = timelineMap.get(date) || { added: 0, qualified: 0, contacted: 0, rejected: 0, failed: 0 };
                    current.added++;
                    if (c.match_score != null && c.match_score >= 50) current.qualified++;
                    if (c.email_sent_at) current.contacted++;
                    if (c.match_score != null && c.match_score < 50) current.rejected++;
                    timelineMap.set(date, current);
                });
                timelineData = Array.from(timelineMap.entries())
                    .map(([date, stats]) => ({
                        date,
                        added: stats.added,
                        qualified: stats.qualified,
                        failed: stats.failed,
                        avgScore: stats.added > 0 ? Math.round(stats.qualified * 100 / stats.added) : 0
                    }))
                    .sort((a, b) => a.date.localeCompare(b.date));
            }

            // Failure Distribution
            const failureMap = new Map<string, number>();
            const getFailLabel = (reason: string) => {
                const r = (reason || '').toLowerCase();
                if (r.includes('upload') || r.includes('storage')) return t('dashboard.failReasons.uploadFailed');
                if (r.includes('pdf') || r.includes('format') || r.includes('type')) return t('dashboard.failReasons.invalidFormat');
                if (r.includes('too_many_pages') || r.includes('pages')) return t('dashboard.failReasons.tooManyPages');
                if (r.includes('corruption') || r.includes('corrupt')) return t('dashboard.failReasons.corruption');
                if (r.includes('validation')) return t('dashboard.failReasons.validationFailed');
                return t('dashboard.failReasons.unknown');
            };

            if (failureDistResult.data && Array.isArray(failureDistResult.data) && failureDistResult.data.length > 0) {
                failureDistResult.data.forEach((item: any) => {
                    const label = getFailLabel(item.reason);
                    failureMap.set(label, (failureMap.get(label) || 0) + Number(item.count || 0));
                });
            }

            const failureDistribution = Array.from(failureMap.entries())
                .map(([reason, count]) => ({ reason, count }))
                .sort((a, b) => b.count - a.count);

            const distribution = [
                { range: '0-20', min: 0, max: 20, count: 0 },
                { range: '21-40', min: 21, max: 40, count: 0 },
                { range: '41-60', min: 41, max: 60, count: 0 },
                { range: '61-80', min: 61, max: 80, count: 0 },
                { range: '81-100', min: 81, max: 100, count: 0 },
            ];

            scores.forEach(score => {
                const bucket = distribution.find(d => score >= d.min && score <= d.max);
                if (bucket) bucket.count++;
            });

            const scoreDistribution = distribution.map(d => ({ range: d.range, count: d.count }));
            const funnelData = [
                { stage: 'imported', count: total, fill: '#6366f1' },
                { stage: 'analyzed', count: completed, fill: '#8b5cf6' },
                { stage: 'qualified', count: qualified, fill: '#10b981' },
                { stage: 'contacted', count: contacted, fill: '#f59e0b' },
            ];

            const contributionMap = new Map<string, { scans: number; qualified: number; rejected: number; contacted: number }>();
            data.forEach(c => {
                if (c.uploaded_by) {
                    const current = contributionMap.get(c.uploaded_by) || { scans: 0, qualified: 0, rejected: 0, contacted: 0 };
                    current.scans++;
                    if (c.match_score != null && c.match_score >= 50) current.qualified++;
                    if (c.match_score != null && c.match_score < 50) current.rejected++;
                    if (c.email_sent_at) current.contacted++;
                    contributionMap.set(c.uploaded_by, current);
                }
            });

            const contributionData = Array.from(contributionMap.entries())
                .map(([userId, stats]) => ({ userId, ...stats }))
                .sort((a, b) => b.scans - a.scans);

            const topCandidates = data
                .filter((c: any) => c.match_score != null)
                .sort((a: any, b: any) => (b.match_score as number) - (a.match_score as number))
                .slice(0, 5)
                .map((c: any) => ({
                    id: c.id,
                    candidateName: c.candidate_name,
                    score: c.match_score,
                    uploadedAt: c.uploaded_at
                }));

            const events = startDate
                ? allEvents.filter(e => isAfter(parseISO(e.created_at), startDate))
                : allEvents;
            const recentFailures = events.filter(e => e.event_type === 'FAIL').length;

            return {
                total,
                completed,
                pending,
                qualified,
                contacted,
                rejected,
                avgScore,
                qualificationRate,
                contactRate,
                completionRate,
                timelineData,
                scoreDistribution,
                failureDistribution,
                funnelData,
                contributionData,
                topCandidates,
                recentFailures,
                riskCount: 0,
                hiddenGemCount: hiddenGemsCount
            };
        }
    });
};
