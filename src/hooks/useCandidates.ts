import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectFile } from '../types';

interface UseCandidatesProps {
    projectId: string;
    userId: string;
    searchQuery: string;
    sortOption: 'SCORE_DESC' | 'SCORE_ASC' | 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC';
    filterScores: ('HIGH' | 'MID' | 'LOW')[];
    filterActivities: ('EMAILED' | 'NOT_EMAILED' | 'EXPORTED' | 'NOT_EXPORTED' | 'VIEWED' | 'NOT_VIEWED' | 'REJECTED')[];
    filterUploaders?: string[];
    enabled?: boolean;
}

const PAGE_SIZE = 50;

export const useCandidates = ({
    projectId,
    userId,
    searchQuery,
    sortOption,
    filterScores,
    filterActivities,
    filterUploaders,
    enabled = true
}: UseCandidatesProps) => {
    const queryClient = useQueryClient();
    // Include userId in query key to refresh if user changes (rare but good practice)
    const queryKey = ['candidates', projectId, userId, searchQuery, sortOption, filterScores, filterActivities, filterUploaders];

    // Real-time Subscription
    useEffect(() => {
        if (!enabled || !projectId) return;

        const channel = supabase
            .channel(`candidates-changes-${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'candidates',
                    filter: `project_id=eq.${projectId}`
                },
                (payload) => {
                    console.log('Real-time update:', payload);
                    // Invalidate query to refetch fresh data and update rankings
                    queryClient.invalidateQueries({ queryKey });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, queryClient, JSON.stringify(queryKey), enabled]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = 0 }) => {
            const { data, error } = await supabase.rpc('get_project_candidates', {
                p_project_id: projectId,
                p_user_id: userId,
                p_search_query: searchQuery || '',
                p_sort_option: sortOption,
                p_filter_scores: filterScores.length > 0 ? filterScores : null,
                p_filter_activities: filterActivities.length > 0 ? filterActivities : null,
                p_filter_uploaders: filterUploaders && filterUploaders.length > 0 ? filterUploaders : null,
                p_page_param: pageParam,
                p_page_size: PAGE_SIZE
            });

            if (error) throw error;

            const candidates = (data || []).map((row: any) => ({
                id: row.id,
                projectId: row.project_id,
                name: row.name || row.candidate_name || 'Unknown Candidate', // Fallback to candidate name or default
                size: row.size || '0 KB', 
                uploadedAt: row.uploaded_at,
                score: row.score,
                candidateName: row.candidate_name,
                uploadedByUserId: row.uploaded_by,
                viewedBy: row.viewed_by,
                exportedBy: row.exported_by,
                emailSentAt: row.email_sent_at,
                emailDraft: row.email_draft,
                rank: row.rank ? Number(row.rank) : undefined,
                status: row.status || 'new',
                isFavorite: row.is_favorite || false,
                // AI Enhanced fields
                email: row.email,
                phone: row.phone,
                location: row.location,
                summary: row.summary,
                skills: row.skills,

                // Elite Data Mapping
                currentPosition: row.current_position,
                yearsOfExperience: row.years_of_experience,
                matchScore: row.match_score,
                scoreJustification: row.score_justification,
                executiveSummary: row.executive_summary,
                keySkills: row.key_skills, // Already JSONB/Array from RPC
                missingSkills: row.missing_skills,
                redFlags: row.red_flags,
                softSkillsAnalysis: row.soft_skills_analysis,
                interviewQuestions: row.interview_questions,
                careerTrajectory: row.career_trajectory,
                socialLinks: row.social_links,
                originalResumeName: row.original_resume_name
            } as ProjectFile));

            const totalCount = data && data.length > 0 ? Number(data[0].full_count) : 0;

            return {
                candidates,
                count: totalCount,
                nextPage: (pageParam + 1) * PAGE_SIZE < totalCount ? pageParam + 1 : undefined
            };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: enabled && !!userId
    });

    const candidates = data?.pages.flatMap(page => page.candidates) || [];
    const totalCount = data?.pages[0]?.count || 0;

    // --- Actions ---
    const updateCandidateStatus = async (candidateId: string, status: 'new' | 'screened' | 'interview' | 'rejected' | 'hired') => {
        const { error } = await supabase
            .from('candidates')
            .update({ status })
            .eq('id', candidateId);

        if (error) {
            console.error('Error updating status:', error);
            throw error;
        }
        
        // Optimistic update via invalidation
        queryClient.invalidateQueries({ queryKey });
    };

    const toggleFavorite = async (candidateId: string, currentFavorite: boolean) => {
        const { error } = await supabase
            .from('candidates')
            .update({ is_favorite: !currentFavorite })
            .eq('id', candidateId);

        if (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }

        // Optimistic update via invalidation
        queryClient.invalidateQueries({ queryKey });
    };

    return {
        candidates,
        totalCount,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        updateCandidateStatus,
        toggleFavorite
    };
};
