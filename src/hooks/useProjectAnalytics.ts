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
    }[];
    
    scoreDistribution: { range: string; count: number }[];
    
    funnelData: { stage: string; count: number; fill: string }[];

    contributionData: { userId: string; scans: number; qualified: number }[];
    
    topCandidates: { id: string; candidateName: string; score: number; uploadedAt: string }[];
    
    // Health
    recentFailures: number;
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
            // 1. All candidates (lightweight columns) for stats
            // 2. Top 5 candidates (fuller details)
            
            const [statsResult, topResult] = await Promise.all([
                supabase
                    .from('candidates')
                    .select('score, uploaded_at, uploaded_by, email_sent_at, size')
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
            if (topResult.error) throw topResult.error;

            // Filter by Date Range locally (simpler than dynamic query for now)
            const allData = statsResult.data || [];
            const data = startDate 
                ? allData.filter(c => isAfter(parseISO(c.uploaded_at), startDate))
                : allData;
            
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

            // Timeline (Advanced)
            const timelineMap = new Map<string, { added: number; qualified: number; contacted: number }>();
            
            // Initialize map with empty dates if needed, but let's just use data points for now
            data.forEach(c => {
                const date = c.uploaded_at.split('T')[0];
                const current = timelineMap.get(date) || { added: 0, qualified: 0, contacted: 0 };
                
                current.added++;
                if (c.score != null && c.score >= 70) current.qualified++;
                if (c.email_sent_at) current.contacted++;
                
                timelineMap.set(date, current);
            });

            const timelineData = Array.from(timelineMap.entries())
                .map(([date, stats]) => ({
                    date,
                    ...stats
                }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Score Distribution
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

            // Funnel
            const funnelData = [
                { stage: 'Importés', count: total, fill: '#6366f1' }, // Indigo
                { stage: 'Analysés', count: completed, fill: '#8b5cf6' }, // Violet
                { stage: 'Qualifiés', count: qualified, fill: '#10b981' }, // Emerald
                { stage: 'Contactés', count: contacted, fill: '#f59e0b' }, // Amber
            ];

            // Contribution (Enhanced)
            const contributionMap = new Map<string, { scans: number; qualified: number }>();
            data.forEach(c => {
                if (c.uploaded_by) {
                    const current = contributionMap.get(c.uploaded_by) || { scans: 0, qualified: 0 };
                    current.scans++;
                    if (c.score != null && c.score >= 70) current.qualified++;
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

            // Failures (Approximation based on size field or missing score after long time? 
            // For now, let's assume if size is present but score is null and old, it's a failure or pending)
            // But better logic: check if status is 'FAILED' if we had that column. 
            // We don't have explicit status column in the select above, but we can infer or add it if needed.
            // Let's just use a placeholder for now or checking if score is null for > 1 hour
            const recentFailures = 0; // Placeholder

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
                funnelData,
                contributionData,
                topCandidates,
                recentFailures,
                pendingScanCount: 0 // Legacy
            };
        }
    });
};
