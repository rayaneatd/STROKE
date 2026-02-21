import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, ConnectionItem, Role, SubscriptionPlan, BillingType } from '../types';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { getOrgNamesFromEmails } from '../utils/emailDomains';

interface UseConnectionsProps {
    currentUser: User;
}

export const useConnections = ({ currentUser }: UseConnectionsProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'connections' | 'received' | 'sent'>('connections');
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [orgFilter, setOrgFilter] = useState<string>('ALL');

    // Subscribe to Real-time changes
    React.useEffect(() => {
        const channel = supabase
            .channel('connections_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'connections'
                },
                (payload: any) => {
                    const { old: oldRow, new: newRow } = payload;
                    // Check if the change involves the current user
                    const isRelevant =
                        (newRow && (newRow.sender_id === currentUser.id || newRow.receiver_id === currentUser.id)) ||
                        (oldRow && (oldRow.sender_id === currentUser.id || oldRow.receiver_id === currentUser.id));

                    if (isRelevant) {
                        queryClient.invalidateQueries({ queryKey: ['network', currentUser.id] });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id, queryClient]);

    // Fetch Connections and corresponding Profile info
    const { data: network = { connections: [], received: [], sent: [] }, isLoading } = useQuery({
        queryKey: ['network', currentUser.id],
        queryFn: async () => {
            const { data, error } = await (supabase.rpc as any)('get_user_connections', { p_user_id: currentUser.id });

            if (error) throw error;

            const connections: ConnectionItem[] = [];
            const received: ConnectionItem[] = [];
            const sent: ConnectionItem[] = [];

            (data as any[]).forEach((item: any) => {
                // Map the profile data to a User type
                const otherUser: User = {
                    id: item.other_user_id,
                    displayName: item.other_user_display_name || item.other_user_email.split('@')[0],
                    email: item.other_user_email,
                    role: Role.USER, // Default role
                    avatarUrl: item.other_user_avatar_url || '',
                    subscriptionPlan: SubscriptionPlan.FREE,
                    scansBalance: 0,
                    purchasedScans: 0,
                    billingType: BillingType.PREPAID,
                    overageCap: 0,
                    emailIntegrations: [],
                    workMails: [],
                    orgNames: item.other_user_org_names || []
                };

                let mappedStatus = item.status;
                if (item.status === 'PENDING') {
                    mappedStatus = item.is_sender ? 'SENT' : 'RECEIVED';
                }

                const connectionItem: ConnectionItem = {
                    id: item.connection_id,
                    otherUser: otherUser,
                    status: mappedStatus as any,
                    date: item.created_at
                };

                if (item.status === 'CONNECTED') {
                    connections.push(connectionItem);
                } else if (item.status === 'PENDING') {
                    if (item.is_sender) {
                        sent.push(connectionItem);
                    } else {
                        received.push(connectionItem);
                    }
                }
            });

            return { connections, received, sent };
        },
        enabled: !!currentUser.id
    });

    const sendInviteMutation = useMutation({
        mutationFn: async (email: string) => {
            // 1. Find the profile by email using secure function
            const { data: profile, error: profileError } = await (supabase.rpc as any)('find_profile_by_email', { search_email: email })
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) throw new Error(t('connections.errors.userNotFound'));
            if ((profile as any).id === currentUser.id) throw new Error(t('connections.errors.selfInvite'));

            // 2. Check if connection already exists
            const { data: existing } = await supabase
                .from('connections')
                .select('id')
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${(profile as any).id}),and(sender_id.eq.${(profile as any).id},receiver_id.eq.${currentUser.id})`)
                .maybeSingle();

            if (existing) throw new Error(t('connections.errors.alreadyExists'));

            // 3. Create connection
            const { error: inviteError } = await supabase
                .from('connections')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: (profile as any).id,
                    status: 'PENDING'
                });

            if (inviteError) throw inviteError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['network'] });
            setMessage({ type: 'success', text: t('connections.success.inviteSent') });
            setInviteEmail('');
        },
        onError: (err: any) => {
            setMessage({ type: 'error', text: err.message });
        }
    });

    const actionMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string, action: 'ACCEPT' | 'DECLINE' | 'CANCEL' | 'REMOVE' }) => {
            if (action === 'ACCEPT') {
                const { error } = await supabase
                    .from('connections')
                    .update({ status: 'CONNECTED' })
                    .eq('id', id);
                if (error) throw error;
            } else {
                // DECLINE, CANCEL, and REMOVE all result in deleting the row in this simple model
                const { error } = await supabase
                    .from('connections')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['network'] });
        },
        onError: (err: any) => {
            alert(t('connections.errors.actionFailed', { error: err.message }));
        }
    });

    const handleSendInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setMessage(null);
        sendInviteMutation.mutate(inviteEmail);
    };

    const handleAction = (id: string, action: 'ACCEPT' | 'DECLINE' | 'CANCEL' | 'REMOVE') => {
        actionMutation.mutate({ id, action });
    };

    const getActiveList = () => network[activeTab];
    
    // Memoize org options to ensure stable references and reactivity
    const orgOptions = React.useMemo(() => {
        // Only show orgs that the current user belongs to
        const emailOrgs = getOrgNamesFromEmails(currentUser.workMails);
        const dbOrgs = currentUser.orgNames || [];
        return Array.from(new Set([...emailOrgs, ...dbOrgs]));
    }, [currentUser.workMails, currentUser.orgNames]);

    // Effect to reset filter if the selected option is no longer available
    React.useEffect(() => {
        if (orgFilter !== 'ALL' && orgFilter !== 'EXTERNAL' && !orgOptions.includes(orgFilter)) {
            setOrgFilter('ALL');
        }
    }, [orgOptions, orgFilter]);

    return {
        activeTab,
        setActiveTab,
        inviteEmail,
        setInviteEmail,
        orgFilter,
        setOrgFilter,
        orgOptions,
        loading: isLoading || sendInviteMutation.isPending || actionMutation.isPending,
        message,
        data: network,
        handleSendInvite,
        handleAction,
        getActiveList
    };
};
