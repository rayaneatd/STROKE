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
            
            const [statsResult, eventsResult, topResult] = await Promise.all([
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
                    .limit(5)
            ]);

            if (statsResult.error) throw statsResult.error;
            if (eventsResult.error) console.warn('Analytics events error:', eventsResult.error); // Non-blocking
            if (topResult.error) throw topResult.error;

            // Filter by Date Range locally
            const allData = statsResult.data || [];
            const allEvents = eventsResult.data || [];

            const data = startDate 
                ? allData.filter(c => isAfter(parseISO(c.uploaded_at), startDate))
                : allData;
            
            const events = startDate
                ? allEvents.filter(e => isAfter(parseISO(e.created_at), startDate))
                : allEvents;
            
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

            // Timeline (Merged source for accuracy)
            const timelineMap = new Map<string, { added: number; qualified: number; contacted: number; rejected: number; failed: number }>();
            const failureMap = new Map<string, number>();
            
            // 1. Process Candidates (Success/Legacy flows)
            data.forEach(c => {
                const date = c.uploaded_at.split('T')[0];
                const current = timelineMap.get(date) || { added: 0, qualified: 0, contacted: 0, rejected: 0, failed: 0 };
                
                current.added++;
                if (c.score != null && c.score >= 70) current.qualified++;
                if (c.email_sent_at) current.contacted++;
                if (c.score != null && c.score < 50) current.rejected++;
                
                timelineMap.set(date, current);
            });

            // 2. Process Events (Failures ONLY)
            events.forEach(e => {
                if (e.event_type === 'FAIL') {
                    const date = e.created_at.split('T')[0];
                    const current = timelineMap.get(date) || { added: 0, qualified: 0, contacted: 0, rejected: 0, failed: 0 };
                    
                    current.failed++;
                    
                    const metadata = e.metadata as { reason?: string } | null;
                    const reason = metadata?.reason || 'Unknown Error';
                    failureMap.set(reason, (failureMap.get(reason) || 0) + 1);
                    
                    timelineMap.set(date, current);
                }
            });

            const timelineData = Array.from(timelineMap.entries())
                .map(([date, stats]) => ({
                    date,
                    ...stats
                }))
                .sort((a, b) => a.date.localeCompare(b.date));

            const failureDistribution = Array.from(failureMap.entries())
                .map(([reason, count]) => ({ reason, count }))
                .sort((a, b) => b.count - a.count);

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

            // Funnel (unchanged)
            const funnelData = [
                { stage: 'Importés', count: total, fill: '#6366f1' }, // Indigo
                { stage: 'Analysés', count: completed, fill: '#8b5cf6' }, // Violet
                { stage: 'Qualifiés', count: qualified, fill: '#10b981' }, // Emerald
                { stage: 'Contactés', count: contacted, fill: '#f59e0b' }, // Amber
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
