import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface InterviewQuestion {
  id: string;
  candidate_id: string;
  question: string;
  context?: string;
  type: 'AI' | 'MANUAL';
  created_by?: string;
  created_at: string;
}

export const useInterviewQuestions = (candidateId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = ['interview-questions', candidateId];

  // Fetch questions
  const { data: questions, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('candidate_interview_questions')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as InterviewQuestion[];
    },
    enabled: !!candidateId
  });

  // Real-time subscription
  useEffect(() => {
    if (!candidateId) return;

    const channel = supabase
      .channel(`interview-questions-${candidateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidate_interview_questions',
          filter: `candidate_id=eq.${candidateId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [candidateId, queryClient, queryKey]);

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (newQuestion: { question: string; context?: string; type: 'AI' | 'MANUAL' }) => {
      if (!candidateId) throw new Error('No candidate ID');
      const { data, error } = await supabase
        .from('candidate_interview_questions')
        .insert({
          candidate_id: candidateId,
          question: newQuestion.question,
          context: newQuestion.context,
          type: newQuestion.type
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidate_interview_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InterviewQuestion> }) => {
      const { error } = await supabase
        .from('candidate_interview_questions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    questions,
    isLoading,
    error,
    addQuestion: addQuestionMutation.mutate,
    deleteQuestion: deleteQuestionMutation.mutate,
    updateQuestion: updateQuestionMutation.mutate,
    isAdding: addQuestionMutation.isPending,
    isDeleting: deleteQuestionMutation.isPending,
    isUpdating: updateQuestionMutation.isPending
  };
};
