import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { User, Role, SubscriptionPlan, BillingType } from '../types';
import { Tables, Json } from '../lib/database.types';
import { classifyEmailDomain, EmailType } from '../utils/emailDomains';

interface UseProfileProps {
    user?: User | null;
    onUpdateUser?: (data: Partial<User>) => void;
    onNavigate?: (path: string) => void;
}

export const useProfile = ({ user: initialUser, onUpdateUser, onNavigate }: UseProfileProps = {}) => {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isNylasConnecting, setIsNylasConnecting] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // 1. Fetch Profile Data
    const { data: user, isLoading: loading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (error) {
                console.warn('Profile query error, using skeleton:', error);
            }

            // Map data or use fallback
            const profile = (data || {}) as Partial<Tables<'profiles'>>;

            // Dual Identity Logic
            let primaryEmail = profile.primary_email;
            let workEmail = profile.work_email;
            const isOwner = profile.is_owner || false;
            const nylasConnected = profile.nylas_connected || false;

            if (!primaryEmail && !workEmail && authUser.email) {
                const type = classifyEmailDomain(authUser.email);
                if (type === EmailType.PUBLIC) {
                    primaryEmail = authUser.email;
                } else {
                    workEmail = authUser.email;
                }
            }

            return {
                id: authUser.id,
                email: authUser.email || '',
                displayName: profile.display_name || authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Member',
                avatarUrl: profile.avatar_url || authUser.user_metadata?.avatar_url || '',
                role: profile.role as Role || Role.USER,
                subscriptionPlan: profile.subscription_plan as SubscriptionPlan || SubscriptionPlan.FREE,
                scansBalance: profile.scans_balance || 0,
                purchasedScans: profile.purchased_scans || 0,
                billingType: profile.billing_type as BillingType || BillingType.PREPAID,
                overageCap: 0,
                preferences: profile.preferences as unknown as Json || {},
                emailIntegrations: [],
                signupDate: profile.signup_date,
                company: (profile.preferences as any)?.company || '',
                industry: (profile.preferences as any)?.industry || '',
                identities: authUser.identities || [],
                newEmail: authUser.new_email,
                primaryEmail,
                workEmail,
                isOwner,
                nylasConnected
            } as unknown as User & { company?: string, industry?: string };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1
    });

    // 2. Form State
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        avatarUrl: '',
        company: '',
        industry: ''
    });

    // Sync form with user data when loaded
    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName,
                email: user.email,
                avatarUrl: user.avatarUrl || '',
                company: user.company || '',
                industry: user.industry || ''
            });
        }
    }, [user]);

    // 3. Mutation for Updates
    const updateMutation = useMutation({
        mutationFn: async (newData: typeof formData) => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('Not authenticated');

            let finalAvatarUrl = newData.avatarUrl;

            // 1. Upload Avatar if changed
            if (avatarFile) {
                // DELETE OLD AVATAR IF EXISTS
                const oldAvatarUrl = user?.avatarUrl;
                if (oldAvatarUrl && oldAvatarUrl.includes('avatars')) {
                    try {
                        // Extract path from URL: .../storage/v1/object/public/avatars/USER_ID/FILENAME
                        const urlParts = oldAvatarUrl.split('/avatars/');
                        if (urlParts.length > 1) {
                            const oldPath = urlParts[1]; // Should be "userId/filename"
                            // Verify it belongs to current user to be safe
                            if (oldPath.startsWith(`${authUser.id}/`)) {
                                await supabase.storage.from('avatars').remove([oldPath]);
                            }
                        }
                    } catch (err) {
                        console.warn('Failed to delete old avatar:', err);
                        // Continue even if delete fails
                    }
                }

                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
                const filePath = `${authUser.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                finalAvatarUrl = publicUrl;
            }

            // 2. Update Profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: newData.displayName,
                    avatar_url: finalAvatarUrl,
                    // Store extra fields in preferences for now if no specific columns
                    preferences: {
                        ...(user?.preferences || {}),
                        company: newData.company,
                        industry: newData.industry
                    } as unknown as Json
                })
                .eq('id', authUser.id);

            if (error) throw error;
            setAvatarFile(null); // Clear file after success
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        },
        onError: () => {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        }
    });

    // Handlers
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
            setAvatarFile(file);

            // Show preview locally
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        updateMutation.mutate(formData);
    };

    // UI/Theme Helpers (same as before)
    const isLight = user?.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = user?.preferences?.uiConfig?.accentColor || 'slate';
    const isTeamPlan = user?.subscriptionPlan === SubscriptionPlan.TEAM || user?.subscriptionPlan === SubscriptionPlan.ELITE;

    const getPlanColor = (plan: SubscriptionPlan) => {
        if (plan === SubscriptionPlan.ELITE || plan === SubscriptionPlan.TEAM) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        if (plan === SubscriptionPlan.PRO) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        return isLight ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-white/5 text-zinc-400 border border-white/10';
    };

    return {
        user,
        formData,
        isNylasConnecting,
        isLoading: loading || updateMutation.isPending,
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
        handleConnectNylas: () => alert("Nylas is simulated"),
        handleDisconnectAccount: (id: string) => alert(`Nylas is simulated. Disconnecting ${id}`),
        getPlanColor
    };
};
