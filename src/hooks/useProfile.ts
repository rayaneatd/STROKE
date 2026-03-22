import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { User, Role, SubscriptionPlan, BillingType } from '../types';
import { useTranslation } from 'react-i18next';
import { Tables, Json } from '../lib/database.types';
import { classifyEmailDomain, EmailType } from '../utils/emailDomains';

interface UseProfileProps {
    user?: User | null;
    onUpdateUser?: (data: Partial<User>) => void;
    onNavigate?: (path: string) => void;
}

export const useProfile = ({ user: initialUser, onUpdateUser, onNavigate }: UseProfileProps = {}) => {
    const { t } = useTranslation();
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
            const authEmail = authUser.email || profile.email || null;
            let primaryEmail = authEmail;
            const workMails = Array.isArray(profile.work_mails) ? (profile.work_mails as unknown as string[]) : [];
            let workEmail = profile.work_email || workMails[0] || null;
            const isOwner = profile.is_owner || false;

            if (authEmail) {
                const type = classifyEmailDomain(authEmail);
                if (type === EmailType.CUSTOM && !workEmail) {
                    workEmail = authEmail;
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
                workMails,
                isOwner,
                marketingConsent: profile.marketing_consent || false,
                feedbackConsent: profile.feedback_consent || false
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

    // Email Identity State
    const [primaryEmailInput, setPrimaryEmailInput] = useState('');
    const [isEditingPrimary, setIsEditingPrimary] = useState(false);
    const [isSavingPrimary, setIsSavingPrimary] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
    const [isWorkEmailModalOpen, setIsWorkEmailModalOpen] = useState(false);
    const [workEmailError, setWorkEmailError] = useState<string | null>(null);
    const [workEmailSuccess, setWorkEmailSuccess] = useState<string | null>(null);

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
            if (user.email) {
                setPrimaryEmailInput(user.email);
            }
        }
    }, [user]);

    // 3. Mutation for Updates
    const updateMutation = useMutation({
        mutationFn: async (newData: typeof formData) => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error(t('profile.errors.notAuthenticated'));

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
            const { error } = await supabase.rpc('update_user_profile', {
                p_display_name: newData.displayName,
                p_avatar_url: finalAvatarUrl,
                p_preferences: {
                    ...(user?.preferences || {}),
                    company: newData.company,
                    industry: newData.industry
                } as any,
                p_company: newData.company,
                p_industry: newData.industry
            } as any);

            if (error) throw error;
            setAvatarFile(null); // Clear file after success
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setMessage({ type: 'success', text: t('profile.success.updated') });
        },
        onError: () => {
            setMessage({ type: 'error', text: t('profile.errors.updateFailed') });
        }
    });

    const updateConsentMutation = useMutation({
        mutationFn: async ({ marketing, feedback }: { marketing?: boolean, feedback?: boolean }) => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error(t('profile.errors.notAuthenticated'));

            const updates: any = {};
            if (marketing !== undefined) updates.marketing_consent = marketing;
            if (feedback !== undefined) updates.feedback_consent = feedback;

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', authUser.id);

            if (error) throw error;
        },
        onMutate: async ({ marketing, feedback }) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['profile'] });
            const previousUser = queryClient.getQueryData(['profile']);
            queryClient.setQueryData(['profile'], (old: any) => ({
                ...old,
                ...(marketing !== undefined ? { marketingConsent: marketing } : {}),
                ...(feedback !== undefined ? { feedbackConsent: feedback } : {})
            }));
            return { previousUser };
        },
        onError: (err, variables, context) => {
            if (context?.previousUser) {
                queryClient.setQueryData(['profile'], context.previousUser);
            }
            setMessage({ type: 'error', text: t('profile.errors.updateFailed') });
        },
        onSuccess: () => {
            // Silent success for real-time toggles
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

    const handleUpdateProfileEmail = async () => {
        setEmailError(null);
        setEmailSuccess(null);
        setIsSavingPrimary(true);

        try {
            if (!user?.id) throw new Error(t('profile.errors.userIdNotFound'));

            const email = primaryEmailInput.trim().toLowerCase();
            const currentEmail = (user?.email || '').trim().toLowerCase();

            // 1. Validate Format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error(t('profile.errors.invalidEmail', 'Invalid email format'));
            }

            // 2. Validate Professional Email (Must be Personal)
            if (classifyEmailDomain(email) === EmailType.CUSTOM) {
                throw new Error(t('profile.errors.professionalEmailNotAllowed', 'Professional emails are not allowed for primary account. Please use a personal email.'));
            }

            if (email === currentEmail) {
                throw new Error(t('profile.errors.emailSame', 'This is already your current email.'));
            }

            // 3. Validate Existence
            const { data: exists, error: checkError } = await supabase.rpc('check_email_availability' as any, {
                email_to_check: email
            });

            if (checkError) throw checkError;
            if (exists) {
                throw new Error(t('profile.errors.emailTaken', 'This email is already associated with another account.'));
            }

            // 4. Update Auth Email (Triggers Verification & Sync)
            const { error } = await supabase.auth.updateUser({ email });

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            setEmailSuccess(t('profile.success.emailUpdateSent', 'Verification link sent to both old and new email addresses.'));
            setIsEditingPrimary(false);
        } catch (err: any) {
            console.error('Update email error:', err);
            setEmailError(err.message || t('profile.errors.emailUpdateFailed'));
        } finally {
            setIsSavingPrimary(false);
        }
    };

    const handleRemoveWorkMail = async (email: string) => {
        setWorkEmailError(null);
        setWorkEmailSuccess(null);
        try {
            if (!user?.id) throw new Error(t('profile.errors.userIdNotFound'));
            const current = user.workMails || [];
            const next = current.filter((item) => item.toLowerCase() !== email.toLowerCase());
            const { error } = await supabase
                .from('profiles')
                .update({ work_mails: next })
                .eq('id', user.id);
            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            setWorkEmailSuccess(t('profile.success.workEmailRemoved'));
        } catch (err: any) {
            setWorkEmailError(err.message || t('profile.errors.workEmailRemoveFailed'));
        }
    };

    const handleConnectAurinko = () => {
        setWorkEmailError(null);
        setWorkEmailSuccess(null);
        const apiUrl = import.meta.env.VITE_AURINKO_API_URL;
        const clientId = import.meta.env.VITE_AURINKO_CLIENT_ID;
        if (!apiUrl || !clientId) {
            setWorkEmailError(t('profile.errors.aurinkoNotConfigured'));
            return;
        }
        const redirectUri = `${window.location.origin}/#/profile`;
        const url = `${apiUrl.replace(/\/$/, '')}/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=mail.read`;
        window.location.href = url;
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

    // Identify Linked Accounts
    const linkedAccounts = user?.identities?.filter(id => id.provider !== 'email') || [];
    const hasLinkedAccounts = linkedAccounts.length > 0;

    return {
        user,
        formData,
        linkedAccounts,
        hasLinkedAccounts,
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
        handleConnectNylas: () => alert(t('common.featureSimulated')),
        handleDisconnectAccount: (id: string) => alert(t('common.featureSimulated')),
        getPlanColor,
        // Email Identity Exports
        primaryEmailInput,
        setPrimaryEmailInput,
        isEditingPrimary,
        setIsEditingPrimary,
        isSavingPrimary,
        emailError,
        emailSuccess,
        handleUpdateProfileEmail,
        isWorkEmailModalOpen,
        setIsWorkEmailModalOpen,
        workEmailError,
        workEmailSuccess,
        handleRemoveWorkMail,
        handleConnectAurinko,
        handleToggleMarketing: (val: boolean) => updateConsentMutation.mutate({ marketing: val }),
        handleToggleFeedback: (val: boolean) => updateConsentMutation.mutate({ feedback: val }),
        isUpdatingConsent: updateConsentMutation.isPending
    };
};
