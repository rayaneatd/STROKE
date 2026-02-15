import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, ConnectionItem, Role, SubscriptionPlan, BillingType } from '../types';
import { supabase } from '../lib/supabase';
import { getOrgNamesFromEmails } from '../utils/emailDomains';

interface UseConnectionsProps {
    currentUser: User;
}

export const useConnections = ({ currentUser }: UseConnectionsProps) => {
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
            const { data, error } = await supabase
                .from('connections')
                .select(`
                    *,
                    sender:profiles!connections_sender_id_fkey(*),
                    receiver:profiles!connections_receiver_id_fkey(*)
                `)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

            if (error) throw error;

            const connections: ConnectionItem[] = [];
            const received: ConnectionItem[] = [];
            const sent: ConnectionItem[] = [];

            data.forEach((item: any) => {
                const otherPartyData = item.sender_id === currentUser.id ? item.receiver : item.sender;

                if (!otherPartyData) {
                     // If RLS or data integrity issue hides the profile, skip this item
                     return;
                }

                // Map the profile data to a User type
                const otherUser: User = {
                    id: otherPartyData.id,
                    displayName: otherPartyData.display_name || otherPartyData.email.split('@')[0],
                    email: otherPartyData.email,
                    role: otherPartyData.role as Role || Role.USER,
                    avatarUrl: otherPartyData.avatar_url || '',
                    subscriptionPlan: otherPartyData.subscription_plan as SubscriptionPlan || SubscriptionPlan.FREE,
                    scansBalance: otherPartyData.scans_balance || 0,
                    purchasedScans: otherPartyData.purchased_scans || 0,
                    billingType: otherPartyData.billing_type as BillingType || BillingType.PREPAID,
                    overageCap: 0,
                    emailIntegrations: [],
                    workMails: Array.isArray(otherPartyData.work_mails) ? otherPartyData.work_mails : [],
                    orgNames: getOrgNamesFromEmails(Array.isArray(otherPartyData.work_mails) ? otherPartyData.work_mails : [])
                };

                let mappedStatus = item.status;
                if (item.status === 'PENDING') {
                    mappedStatus = item.sender_id === currentUser.id ? 'SENT' : 'RECEIVED';
                }

                const connectionItem: ConnectionItem = {
                    id: item.id,
                    otherUser: otherUser,
                    status: mappedStatus as any,
                    date: item.created_at
                };

                if (item.status === 'CONNECTED') {
                    connections.push(connectionItem);
                } else if (item.status === 'PENDING') {
                    if (item.sender_id === currentUser.id) {
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
            // 1. Find the profile by email
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) throw new Error("No user found with this email address.");
            if (profile.id === currentUser.id) throw new Error("You cannot invite yourself.");

            // 2. Check if connection already exists
            const { data: existing } = await supabase
                .from('connections')
                .select('id')
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUser.id})`)
                .maybeSingle();

            if (existing) throw new Error("A connection or invite already exists with this user.");

            // 3. Create connection
            const { error: inviteError } = await supabase
                .from('connections')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: profile.id,
                    status: 'PENDING'
                });

            if (inviteError) throw inviteError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['network'] });
            setMessage({ type: 'success', text: "Invitation sent successfully!" });
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
            alert(err.message);
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
        const allOrgs = new Set<string>();
        network.connections.forEach((c) => {
            (c.otherUser.orgNames || []).forEach((o) => allOrgs.add(o));
        });
        getOrgNamesFromEmails(currentUser.workMails).forEach((org) => allOrgs.add(org));
        return Array.from(allOrgs.values());
    }, [network.connections, currentUser.workMails]);

    // Effect to reset filter if the selected option is no longer available
    React.useEffect(() => {
        if (orgFilter !== 'ALL' && !orgOptions.includes(orgFilter)) {
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
