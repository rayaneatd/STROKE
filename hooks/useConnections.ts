import React, { useState, useEffect } from 'react';
import { User, ConnectionItem } from '../types';
import { sendConnectionRequest, fetchNetworkData, updateConnectionStatus } from '../services/mockData';

interface UseConnectionsProps {
    currentUser: User;
}

export const useConnections = ({ currentUser }: UseConnectionsProps) => {
    const [activeTab, setActiveTab] = useState<'connections' | 'received' | 'sent'>('connections');
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [data, setData] = useState<{
        connections: ConnectionItem[];
        received: ConnectionItem[];
        sent: ConnectionItem[];
    }>({ connections: [], received: [], sent: [] });

    const loadData = () => {
        const networkData = fetchNetworkData(currentUser.id);
        setData(networkData);
    };

    useEffect(() => {
        loadData();
    }, [currentUser.id]);

    const handleSendInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setLoading(true);
        setMessage(null);

        // Simulate network delay
        setTimeout(() => {
            try {
                const resultMsg = sendConnectionRequest(currentUser.id, inviteEmail);
                setMessage({ type: 'success', text: resultMsg });
                setInviteEmail('');
                loadData();
            } catch (err: any) {
                setMessage({ type: 'error', text: err.message });
            } finally {
                setLoading(false);
            }
        }, 600);
    };

    const handleAction = (id: string, action: 'ACCEPT' | 'DECLINE' | 'CANCEL' | 'REMOVE') => {
        try {
            updateConnectionStatus(id, action);
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getActiveList = () => data[activeTab];

    return {
        activeTab,
        setActiveTab,
        inviteEmail,
        setInviteEmail,
        loading,
        message,
        data,
        handleSendInvite,
        handleAction,
        getActiveList
    };
};
