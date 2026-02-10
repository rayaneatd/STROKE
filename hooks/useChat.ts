
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectMessage, ChannelType, ProjectId, UserId } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useChat(projectId: string, channel: ChannelType, currentUserId: string) {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<ProjectMessage[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const PAGE_SIZE = 50;

    // Fetch initial messages
    const { data: initialData, isLoading, isError } = useQuery({
        queryKey: ['messages', projectId, channel],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('project_messages')
                .select('*')
                .eq('project_id', projectId)
                .eq('channel', channel)
                .order('created_at', { ascending: false })
                .limit(PAGE_SIZE);

            if (error) throw error;

            // Map to camelCase to match types.ts
            return (data || []).map(m => ({
                id: m.id,
                projectId: m.project_id as ProjectId,
                channel: m.channel as ChannelType,
                senderId: m.sender_id as UserId,
                content: m.content,
                timestamp: m.created_at,
                isEncrypted: m.is_encrypted
            })).reverse();
        }
    });

    useEffect(() => {
        if (initialData) {
            setMessages(initialData);
            setHasMore(initialData.length === PAGE_SIZE);
        }
    }, [initialData]);

    // Real-time subscription
    useEffect(() => {
        const subscription = supabase
            .channel(`project-chat:${projectId}:${channel}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'project_messages',
                    filter: `project_id=eq.${projectId}`
                },
                (payload) => {
                    const newMsg = payload.new;
                    if (newMsg.channel === channel) {
                        const mappedMsg: ProjectMessage = {
                            id: newMsg.id,
                            projectId: newMsg.project_id as ProjectId,
                            channel: newMsg.channel as ChannelType,
                            senderId: newMsg.sender_id as UserId,
                            content: newMsg.content,
                            timestamp: newMsg.created_at,
                            isEncrypted: newMsg.is_encrypted
                        };
                        setMessages(prev => [...prev, mappedMsg]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [projectId, channel]);

    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const { error } = await supabase
                .from('project_messages')
                .insert({
                    project_id: projectId,
                    channel,
                    sender_id: currentUserId,
                    content,
                    is_encrypted: false
                });

            if (error) throw error;
        }
    });

    const loadMore = useCallback(async () => {
        if (!hasMore || messages.length === 0 || isFetchingMore) return;

        setIsFetchingMore(true);
        const oldestTimestamp = messages[0].timestamp;
        try {
            const { data, error } = await supabase
                .from('project_messages')
                .select('*')
                .eq('project_id', projectId)
                .eq('channel', channel)
                .lt('created_at', oldestTimestamp)
                .order('created_at', { ascending: false })
                .limit(PAGE_SIZE);

            if (error) throw error;

            if (data) {
                const olderMessages = data.map(m => ({
                    id: m.id,
                    projectId: m.project_id as ProjectId,
                    channel: m.channel as ChannelType,
                    senderId: m.sender_id as UserId,
                    content: m.content,
                    timestamp: m.created_at,
                    isEncrypted: m.is_encrypted
                })).reverse();

                setMessages(prev => [...olderMessages, ...prev]);
                setHasMore(data.length === PAGE_SIZE);
            }
        } catch (error) {
            console.error("Error loading more messages:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [projectId, channel, hasMore, messages, isFetchingMore]);

    return {
        messages,
        isLoading,
        isError,
        sendMessage: sendMessageMutation.mutate,
        isSending: sendMessageMutation.isPending,
        loadMore,
        hasMore,
        isFetchingMore
    };
}
