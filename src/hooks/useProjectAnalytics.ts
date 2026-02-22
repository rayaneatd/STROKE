import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startOfDay, subDays, isAfter, parseISO, format } from 'date-fns';

export type TimeRange = '7d' | '30d' | '90d' | 'ALL';

interface ProjectAnalytics {
    total: number;
    completed: number;
    pending: number;
    qualified: number; // Score >= 70
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
}

export const useProjectAnalytics = (projectId: string, timeRange: TimeRange = 'ALL') => {
    return useQuery({
        queryKey: ['project-analytics', projectId, timeRange],
        queryFn: async (): Promise<ProjectAnalytics> => {
            // Calculate start date based on range
            let startDate: Date | null = null;
            const now = new Date();
            
            if (timeRange === '7d') startDate = subDays(now, 7);
            if (timeRange === '30d') startDate = subDays(now, 30);
            if (timeRange === '90d') startDate = subDays(now, 90);
            
            // Parallel requests:
            // 1. All candidates for legacy stats
            // 2. Analytics Events for accurate historical & team data
            // 3. Top 5 candidates
            
            const [statsResult, eventsResult, topResult, timelineResult, failureDistResult] = await Promise.all([
                supabase
                    .from('candidates')
                    .select('score, uploaded_at, uploaded_by, email_sent_at, size')
                    .eq('project_id', projectId),
                supabase
                    .from('analytics_events')
                    .select('*')
                    .eq('project_id', projectId),
                supabase
                    .from('candidates')
                    .select('id, candidate_name, score, uploaded_at')
                    .eq('project_id', projectId)
                    .not('score', 'is', null)
                    .order('score', { ascending: false })
                    .limit(5),
                // New optimized RPC calls
                supabase.rpc('get_project_activity_timeline', {
                    p_project_id: projectId,
                    p_start_date: startDate ? startDate.toISOString() : null
                }),
                supabase.rpc('get_project_failure_distribution', {
                    p_project_id: projectId,
                    p_start_date: startDate ? startDate.toISOString() : null
                })
            ]);

            if (statsResult.error) throw statsResult.error;
            if (eventsResult.error) console.warn('Analytics events error:', eventsResult.error);
            if (topResult.error) throw topResult.error;
            if (timelineResult.error) console.warn('Timeline RPC error:', timelineResult.error);
            if (failureDistResult.error) console.warn('Failure Dist RPC error:', failureDistResult.error);

            // Filter by Date Range locally (Legacy stats)
            const allData = statsResult.data || [];
            const allEvents = eventsResult.data || [];

            const data = startDate 
                ? allData.filter(c => isAfter(parseISO(c.uploaded_at), startDate))
                : allData;
            
            // Basic Stats (Still based on current state for accuracy of "now")
            const total = data.length;
            const completed = data.filter(c => c.score != null).length;
            const pending = total - completed;
            const qualified = data.filter(c => c.score != null && c.score >= 70).length;
            const rejected = data.filter(c => c.score != null && c.score < 50).length;
            const contacted = data.filter(c => c.email_sent_at != null).length;

            const scores = data
                .filter(c => c.score != null)
                .map(c => c.score as number);
            
            const avgScore = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;

            // Rates
            const qualificationRate = completed > 0 ? Math.round((qualified / completed) * 100) : 0;
            const contactRate = qualified > 0 ? Math.round((contacted / qualified) * 100) : 0;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Timeline (Use RPC result if available, otherwise fallback to legacy calculation)
            let timelineData: any[] = [];
            
            if (timelineResult.data && Array.isArray(timelineResult.data) && timelineResult.data.length > 0) {
                // Ensure data types are correct for Recharts
                timelineData = timelineResult.data.map((item: any) => ({
                    date: item.date, // 'YYYY-MM-DD'
                    added: Number(item.added || 0),
                    qualified: Number(item.qualified || 0),
                    failed: Number(item.failed || 0)
                }));
            } else {
                // Fallback Logic (Legacy)
                const timelineMap = new Map<string, { added: number; qualified: number; contacted: number; rejected: number; failed: number }>();
                
                data.forEach(c => {
                    const date = c.uploaded_at.split('T')[0];
                    const current = timelineMap.get(date) || { added: 0, qualified: 0, contacted: 0, rejected: 0, failed: 0 };
                    
                    current.added++;
                    if (c.score != null && c.score >= 70) current.qualified++;
                    if (c.email_sent_at) current.contacted++;
                    if (c.score != null && c.score < 50) current.rejected++;
                    
                    timelineMap.set(date, current);
                });

                // Failures from events (Legacy fallback)
                const events = startDate
                    ? allEvents.filter(e => isAfter(parseISO(e.created_at), startDate))
                    : allEvents;

                events.forEach(e => {
                    if (e.event_type === 'FAIL') {
                        const date = e.created_at.split('T')[0];
                        const current = timelineMap.get(date) || { added: 0, qualified: 0, contacted: 0, rejected: 0, failed: 0 };
                        current.failed++;
                        timelineMap.set(date, current);
                    }
                });

                timelineData = Array.from(timelineMap.entries())
                    .map(([date, stats]) => ({
                        date,
                        ...stats
                    }))
                    .sort((a, b) => a.date.localeCompare(b.date));
            }

            // Failure Distribution (Use RPC result if available)
            let failureDistribution: any[] = [];
            
            if (failureDistResult.data && Array.isArray(failureDistResult.data) && failureDistResult.data.length > 0) {
                 failureDistribution = failureDistResult.data.map((item: any) => ({
                    reason: item.reason || 'Unknown Error',
                    count: Number(item.count || 0)
                }));
            } else {
                // Fallback Logic
                const failureMap = new Map<string, number>();
                const events = startDate
                    ? allEvents.filter(e => isAfter(parseISO(e.created_at), startDate))
                    : allEvents;

                events.forEach(e => {
                    if (e.event_type === 'FAIL') {
                        const metadata = e.metadata as { reason?: string } | null;
                        const reason = metadata?.reason || 'Unknown Error';
                        failureMap.set(reason, (failureMap.get(reason) || 0) + 1);
                    }
                });

                failureDistribution = Array.from(failureMap.entries())
                    .map(([reason, count]) => ({ reason, count }))
                    .sort((a, b) => b.count - a.count);
            }

            // Score Distribution (unchanged)
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

            // Funnel (using keys for translation)
            const funnelData = [
                { stage: 'imported', count: total, fill: '#6366f1' }, // Indigo
                { stage: 'analyzed', count: completed, fill: '#8b5cf6' }, // Violet
                { stage: 'qualified', count: qualified, fill: '#10b981' }, // Emerald
                { stage: 'contacted', count: contacted, fill: '#f59e0b' }, // Amber
            ];

            // Contribution (Legacy source for consistency)
            const contributionMap = new Map<string, { scans: number; qualified: number; rejected: number; contacted: number }>();
            
            data.forEach(c => {
                if (c.uploaded_by) {
                    const current = contributionMap.get(c.uploaded_by) || { scans: 0, qualified: 0, rejected: 0, contacted: 0 };
                    current.scans++;
                    if (c.score != null && c.score >= 70) current.qualified++;
                    if (c.score != null && c.score < 50) current.rejected++;
                    if (c.email_sent_at) current.contacted++;
                    contributionMap.set(c.uploaded_by, current);
                }
            });
            
            const contributionData = Array.from(contributionMap.entries())
                .map(([userId, stats]) => ({ userId, ...stats }))
                .sort((a, b) => b.scans - a.scans);

            const topCandidates = topResult.data.map((c: any) => ({
                id: c.id,
                candidateName: c.candidate_name,
                score: c.score,
                uploadedAt: c.uploaded_at
            }));

            // Failures
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
                riskCount: 0
            };
        }
    });
};
