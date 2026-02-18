import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ProjectAnalytics {
    total: number;
    completed: number;
    pending: number;
    pendingScanCount: number;
    avgScore: number;
    timelineData: { date: string; applications: number }[];
    contributionData: { userId: string; scans: number }[];
    topCandidates: { id: string; candidateName: string; score: number; uploadedAt: string }[];
    riskCount: number;
}

export const useProjectAnalytics = (projectId: string) => {
    return useQuery({
        queryKey: ['project-analytics', projectId],
        queryFn: async (): Promise<ProjectAnalytics> => {
            // Parallel requests:
            // 1. All candidates (lightweight columns) for stats
            // 2. Top 5 candidates (fuller details)
            
            const [statsResult, topResult] = await Promise.all([
                supabase
                    .from('candidates')
                    .select('score, uploaded_at, uploaded_by, email_sent_at')
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

            const data = statsResult.data || [];
            
            const total = data.length;
            const completed = data.filter(c => c.score != null).length;
            const pending = total - completed;
            const riskCount = data.filter(c => !c.email_sent_at).length;

            const scores = data
                .filter(c => c.score != null)
                .map(c => c.score as number);
            
            const avgScore = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;

            // Timeline
            const timelineMap = new Map<string, number>();
            data.forEach(c => {
                // Use substring to get YYYY-MM-DD to avoid timezone issues or locale issues
                const date = new Date(c.uploaded_at).toISOString().split('T')[0];
                timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
            });
            const timelineData = Array.from(timelineMap.entries())
                .map(([date, count]) => ({ date, applications: count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Contribution
            const contributionMap = new Map<string, number>();
            data.forEach(c => {
                if (c.uploaded_by) {
                    contributionMap.set(c.uploaded_by, (contributionMap.get(c.uploaded_by) || 0) + 1);
                }
            });
            const contributionData = Array.from(contributionMap.entries())
                .map(([userId, scans]) => ({ userId, scans }));

            const topCandidates = topResult.data.map((c: any) => ({
                id: c.id,
                candidateName: c.candidate_name,
                score: c.score,
                uploadedAt: c.uploaded_at
            }));

            return {
                total,
                completed,
                pending,
                riskCount,
                pendingScanCount: 0, // Placeholder
                avgScore,
                timelineData,
                contributionData,
                topCandidates
            };
        }
    });
};
