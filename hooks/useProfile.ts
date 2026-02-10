import React, { useState, useRef, useEffect } from 'react';
import { User, SubscriptionPlan } from '../types';
import { updateUser as updateUserMock } from '../services/mockData';

interface UseProfileProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onNavigate: (page: string) => void;
}

export const useProfile = ({ user, onUpdateUser, onNavigate }: UseProfileProps) => {
    const [formData, setFormData] = useState({
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        avatarUrl: user.avatarUrl || '',
        company: user.company || '',
        industry: user.industry || ''
    });
    const [isNylasConnecting, setIsNylasConnecting] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const objectUrlRef = useRef<string | null>(null);

    // Theme Logic
    const isLight = user.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = user.preferences?.uiConfig?.accentColor || 'blue';

    const isTeamPlan = user.subscriptionPlan === SubscriptionPlan.TEAM || user.subscriptionPlan === SubscriptionPlan.ELITE;

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleIndustryChange = (value: string) => {
        setFormData({ ...formData, industry: value });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            const imageUrl = URL.createObjectURL(file);
            objectUrlRef.current = imageUrl;
            setFormData({ ...formData, avatarUrl: imageUrl });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        setTimeout(() => {
            try {
                // Strictly update only profile fields, not subscription plan
                const updated = updateUserMock(user.id, {
                    displayName: formData.displayName,
                    phoneNumber: formData.phoneNumber,
                    avatarUrl: formData.avatarUrl,
                    company: formData.company,
                    industry: formData.industry,
                    preferences: user.preferences
                });
                onUpdateUser(updated);
                setMessage({ type: 'success', text: 'Profile updated successfully' });
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to update profile' });
            } finally {
                setIsLoading(false);
            }
        }, 800);
    };

    // Nylas Simulation
    const handleConnectNylas = () => {
        // Check Plan Limit for multiple accounts
        if (!isTeamPlan && user.emailIntegrations.length > 0) {
            alert("Upgrade to Team Plan to connect multiple accounts.");
            return;
        }

        setIsNylasConnecting(true);

        // Capture current plan to ensure NO changes occur during async operation
        const currentPlan = user.subscriptionPlan;

        setTimeout(() => {
            // Generate a mock new integration
            const newIntegration = {
                id: `email-${Date.now()}`,
                provider: 'GMAIL' as const,
                emailAddress: user.emailIntegrations.length === 0 ? formData.email : `secondary.${Date.now()}@gmail.com`,
                isConnected: true,
                addedAt: new Date().toISOString()
            };

            // Explicitly ONLY update emailIntegrations
            // We defensively pass `subscriptionPlan: currentPlan` to guarantee no changes
            const updated = updateUserMock(user.id, {
                emailIntegrations: [...user.emailIntegrations, newIntegration],
                preferences: user.preferences,
                subscriptionPlan: currentPlan
            });
            onUpdateUser(updated);
            setIsNylasConnecting(false);
        }, 1500);
    };

    const handleDisconnectAccount = (integrationId: string) => {
        const updated = updateUserMock(user.id, {
            emailIntegrations: user.emailIntegrations.filter(i => i.id !== integrationId),
            preferences: user.preferences
        });
        onUpdateUser(updated);
    };

    const getPlanColor = (plan: SubscriptionPlan) => {
        if (plan === SubscriptionPlan.ELITE || plan === SubscriptionPlan.TEAM) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        if (plan === SubscriptionPlan.PRO) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        return isLight ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-white/5 text-zinc-400 border border-white/10';
    };

    return {
        formData,
        isNylasConnecting,
        isLoading,
        message,
        fileInputRef,
        isLight,
        accentColor,
        isTeamPlan,
        handleChange,
        handleIndustryChange,
        handleAvatarClick,
        handleFileChange,
        handleSubmit,
        handleConnectNylas,
        handleDisconnectAccount,
        getPlanColor
    };
};
