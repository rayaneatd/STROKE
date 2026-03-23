import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Role, SubscriptionPlan, BillingType } from '../types';
import { supabase } from '../lib/supabase';
import { TablesUpdate, Json } from '../lib/database.types';
import { classifyEmailDomain, EmailType } from '../utils/emailDomains';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>, syncWithBackend?: boolean) => void;
    refreshUser: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Helper to ensure a user object has consistent scan balance data
 * handles both camelCase (frontend) and snake_case (realtime DB payload) inputs
 */
const normalizeUser = (input: any, current: User): User => {
    const result = { ...current, ...input };

    // Normalize snake_case keys from DB to camelCase UI keys
    if (input.display_name) result.displayName = input.display_name;
    if (input.avatar_url) result.avatarUrl = input.avatar_url;
    if (input.subscription_plan) result.subscriptionPlan = input.subscription_plan;
    if (input.billing_type) result.billingType = input.billing_type;
    if (input.overage_cap !== undefined) result.overageCap = input.overage_cap;
    if (input.marketing_consent !== undefined) result.marketingConsent = input.marketing_consent;
    if (input.feedback_consent !== undefined) result.feedbackConsent = input.feedback_consent;

    // Handle Scan Balance logic
    const rawPacks = input.scans_balance || input.scansBalanceDetail;
    if (rawPacks && Array.isArray(rawPacks)) {
        result.scansBalanceDetail = rawPacks;
        result.scansBalance = rawPacks.reduce((acc: number, slot: any) => {
            const count = Number(slot.count) || 0;
            // Only count non-expired packs
            if (!slot.expires_at || new Date(slot.expires_at) > new Date()) {
                return acc + count;
            }
            return acc;
        }, 0);
    } else if (input.scansBalance !== undefined) {
        // If scansBalance was passed directly as an array (common mistake when passing raw DB object)
        if (Array.isArray(input.scansBalance)) {
            result.scansBalanceDetail = input.scansBalance;
            result.scansBalance = input.scansBalance.reduce((acc: number, slot: any) => {
                const count = Number(slot.count) || 0;
                if (!slot.expires_at || new Date(slot.expires_at) > new Date()) {
                    return acc + count;
                }
                return acc;
            }, 0);
        } else {
            // It's already a number
            result.scansBalance = Number(input.scansBalance) || 0;
        }
    }

    return result;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string, authUser: any) => {
        try {
            // Try RPC first to bypass potential RLS issues
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile' as any);

            let data = null;

            if (!rpcError && rpcData) {
                data = rpcData;
            } else {
                console.warn('[AuthContext] RPC failed/empty, trying direct select:', rpcError);
                const { data: selectData, error: selectError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (selectError) console.error('[AuthContext] Select error:', selectError);
                data = selectData;
            }

            if (data) {
                console.log(`[AuthContext] Profile loaded. Balance: ${data.scans_balance}`);
                // Dual Identity Logic
                const authEmail = authUser.email || data.email || null;
                let primaryEmail = authEmail;
                const workMails = Array.isArray(data.work_mails) ? data.work_mails : [];
                let workEmail = data.work_email || workMails[0] || null;
                const isOwner = data.is_owner || false;

                if (authEmail) {
                    const type = classifyEmailDomain(authEmail);
                    if (type === EmailType.CUSTOM && !workEmail) {
                        workEmail = authEmail;
                    }
                }

                return {
                    id: data.id,
                    email: authUser.email || data.email, // Prefer authUser email as source of truth
                    displayName: data.display_name || authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Member',
                    avatarUrl: data.avatar_url || authUser.user_metadata?.avatar_url || '',
                    role: data.role as Role || Role.USER,
                    subscriptionPlan: data.subscription_plan as SubscriptionPlan || SubscriptionPlan.FREE,
                    scansBalanceDetail: (Array.isArray(data.scans_balance) ? data.scans_balance : []) as unknown as any[],
                    scansBalance: Array.isArray(data.scans_balance)
                        ? (data.scans_balance as any[]).reduce((acc, slot) => {
                            // Only sum if not expired
                            if (!slot.expires_at || new Date(slot.expires_at) > new Date()) {
                                return acc + (slot.count || 0);
                            }
                            return acc;
                        }, 0)
                        : 0,
                    purchasedScans: data.purchased_scans || 0,
                    billingType: data.billing_type as BillingType || BillingType.PREPAID,
                    overageCap: data.overage_cap || 0,
                    company: data.company || '',
                    industry: data.industry || '',
                    preferences: data.preferences as Json || {},
                    emailIntegrations: [],
                    signupDate: data.signup_date || undefined,
                    identities: authUser.identities || [],
                    newEmail: authUser.new_email,
                    primaryEmail,
                    workEmail,
                    workMails,
                    isOwner,
                    marketingConsent: !!data.marketing_consent,
                    feedbackConsent: !!data.feedback_consent
                } as unknown as User;
            }
        } catch (err) {
            console.error('Fetch profile error:', err);
        }

        console.warn('[AuthContext] Using fallback profile (0 scans)');
        // Optimistic Fallback: Return skeleton user from Auth Metadata 
        // to prevent redirect loops or "Loading" hangs
        const type = classifyEmailDomain(authUser.email || '');
        const fallbackWorkMails = type === EmailType.CUSTOM && authUser.email ? [authUser.email] : [];
        return {
            id: userId,
            email: authUser.email || '',
            displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Member',
            avatarUrl: authUser.user_metadata?.avatar_url || '',
            role: Role.USER,
            subscriptionPlan: SubscriptionPlan.FREE,
            scansBalance: 0,
            scansBalanceDetail: [],
            purchasedScans: 0,
            billingType: BillingType.PREPAID,
            overageCap: 0,
            preferences: {},
            emailIntegrations: [],
            identities: authUser.identities || [],
            newEmail: authUser.new_email,
            primaryEmail: type === EmailType.PUBLIC ? authUser.email : null,
            workEmail: type === EmailType.CUSTOM ? authUser.email : null,
            workMails: fallbackWorkMails,
            isOwner: false,
            nylasConnected: false,
            marketingConsent: !!authUser.user_metadata?.marketing_consent,
            feedbackConsent: !!authUser.user_metadata?.feedback_consent
        } as unknown as User;
    };

    useEffect(() => {
        let isMounted = true;

        const loadingTimeout = setTimeout(() => {
            if (isMounted && loading) setLoading(false);
        }, 3000); // Reduced to 3s for snappier feel

        const handleAuthChange = async (session: any) => {
            if (session?.user) {
                const emailType = classifyEmailDomain(session.user.email || '');
                if (emailType === EmailType.CUSTOM) {
                    localStorage.setItem('login_error', 'Work emails are not allowed for login. Please use a personal email.');
                    await supabase.auth.signOut();
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                    }
                    return;
                }

                // === CONSENT FAIL-SAFE SYNC BEFORE FETCHING PROFILE ===
                const pendingMarketing = localStorage.getItem('pending_marketing_consent');
                const pendingFeedback = localStorage.getItem('pending_feedback_consent');
                if (pendingMarketing !== null || pendingFeedback !== null) {
                    const updates: any = {};
                    if (pendingMarketing === 'true') updates.marketing_consent = true;
                    if (pendingFeedback === 'true') updates.feedback_consent = true;

                    if (Object.keys(updates).length > 0) {
                        // Bypass RLS issues by using the user's active session
                        await supabase
                            .from('profiles')
                            .update(updates)
                            .eq('id', session.user.id);
                    }
                    localStorage.removeItem('pending_marketing_consent');
                    localStorage.removeItem('pending_feedback_consent');
                }

                const profile = await fetchProfile(session.user.id, session.user);
                if (isMounted) {
                    setUser(profile);
                    setLoading(false);
                }
            } else {
                if (isMounted) {
                    setUser(null);
                    setLoading(false);
                }
            }
        };

        // Single Initialization Path
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthChange(session);
        }).catch(err => {
            console.error('Session init error:', err);
            if (isMounted) setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleAuthChange(session);
        });

        // Profile Real-time Subscription
        let profileSubscription: any = null;
        if (user?.id) {
            profileSubscription = supabase
                .channel(`profile_realtime_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`
                    },
                    (payload: any) => {
                        console.log('Realtime profile update received:', payload);

                        // Optimistically update local state
                        const newRecord = payload.new;
                        if (newRecord && user) {
                            setUser(prev => {
                                if (!prev) return null;
                                return normalizeUser(newRecord, prev);
                            });
                        }
                    }
                )
                .subscribe();
        }

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            if (profileSubscription) supabase.removeChannel(profileSubscription);
            clearTimeout(loadingTimeout);
        };
    }, [user?.id]); // Re-subscribe if user ID changes

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const updateUser = async (data: Partial<User>, syncWithBackend = false) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = normalizeUser(data, prev);
            return updated;
        });

        if (syncWithBackend && user?.id) {
            // Clean data for Supabase update
            const { scansBalance, scansBalanceDetail, email, identities, ...profileUpdates } = data as any;

            // Map camelCase fields to snake_case for Postgres
            const dbUpdates: any = {};
            if (profileUpdates.displayName !== undefined) dbUpdates.display_name = profileUpdates.displayName;
            if (profileUpdates.avatarUrl !== undefined) dbUpdates.avatar_url = profileUpdates.avatarUrl;
            if (profileUpdates.preferences !== undefined) dbUpdates.preferences = profileUpdates.preferences;
            if (profileUpdates.company !== undefined) dbUpdates.company = profileUpdates.company;
            if (profileUpdates.industry !== undefined) dbUpdates.industry = profileUpdates.industry;
            if (profileUpdates.billingType !== undefined) dbUpdates.billing_type = profileUpdates.billingType;
            if (profileUpdates.overageCap !== undefined) dbUpdates.overage_cap = profileUpdates.overageCap;
            if (profileUpdates.marketingConsent !== undefined) dbUpdates.marketing_consent = profileUpdates.marketingConsent;
            if (profileUpdates.feedbackConsent !== undefined) dbUpdates.feedback_consent = profileUpdates.feedbackConsent;

            // If explicit scans update is passed (rare but possible), map to scans_balance
            if (data.scansBalanceDetail !== undefined) dbUpdates.scans_balance = data.scansBalanceDetail;

            if (Object.keys(dbUpdates).length > 0) {
                supabase
                    .from('profiles')
                    .update(dbUpdates)
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) {
                            console.error('[AuthContext] Update error:', error);
                        }
                    });
            }
        }
    };

    const refreshUser = async () => {
        if (!user?.id) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await fetchProfile(session.user.id, session.user);
                setUser(profile);
            }
        } catch (err) {
            console.error('Refresh user error:', err);
        }
    };

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        logout,
        updateUser,
        refreshUser,
        loading
    }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
