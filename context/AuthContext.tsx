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
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string, authUser: any) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                // Dual Identity Logic
                let primaryEmail = data.primary_email;
                let workEmail = data.work_email;
                const isOwner = data.is_owner || false;
                const nylasConnected = data.nylas_connected || false;

                if (!primaryEmail && !workEmail && authUser.email) {
                    const type = classifyEmailDomain(authUser.email);
                    if (type === EmailType.PUBLIC) {
                        primaryEmail = authUser.email;
                    } else {
                        workEmail = authUser.email;
                    }
                }

                return {
                    id: data.id,
                    email: authUser.email || data.email, // Prefer authUser email as source of truth
                    displayName: data.display_name || authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Member',
                    avatarUrl: data.avatar_url || authUser.user_metadata?.avatar_url || '',
                    role: data.role as Role || Role.USER,
                    subscriptionPlan: data.subscription_plan as SubscriptionPlan || SubscriptionPlan.FREE,
                    scansBalance: data.scans_balance || 0,
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
                    isOwner,
                    nylasConnected
                } as unknown as User;
            }
        } catch (err) {
            console.error('Fetch profile error:', err);
        }

        // Optimistic Fallback: Return skeleton user from Auth Metadata 
        // to prevent redirect loops or "Loading" hangs
        const type = classifyEmailDomain(authUser.email || '');
        return {
            id: userId,
            email: authUser.email || '',
            displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Member',
            avatarUrl: authUser.user_metadata?.avatar_url || '',
            role: Role.USER,
            subscriptionPlan: SubscriptionPlan.FREE,
            scansBalance: 0,
            purchasedScans: 0,
            billingType: BillingType.PREPAID,
            overageCap: 0,
            preferences: {},
            emailIntegrations: [],
            identities: authUser.identities || [],
            newEmail: authUser.new_email,
            primaryEmail: type === EmailType.PUBLIC ? authUser.email : null,
            workEmail: type === EmailType.CUSTOM ? authUser.email : null,
            isOwner: false,
            nylasConnected: false
        } as unknown as User;
    };

    useEffect(() => {
        let isMounted = true;

        const loadingTimeout = setTimeout(() => {
            if (isMounted && loading) setLoading(false);
        }, 3000); // Reduced to 3s for snappier feel

        const handleAuthChange = async (session: any) => {
            if (session?.user) {
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
                    (payload) => {
                        fetchProfile(user.id as unknown as string, {
                            email: user.email,
                            user_metadata: {
                                display_name: user.displayName,
                                avatar_url: user.avatarUrl
                            }
                        }).then(updatedProfile => {
                            if (isMounted) setUser(updatedProfile);
                        });
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
        setUser((prev) => {
            if (!prev) return null;
            return { ...prev, ...data };
        });

        if (syncWithBackend && user?.id) {
            try {
                // Map local fields to DB fields if necessary
                const dbData: TablesUpdate<'profiles'> = {};
                if (data.displayName !== undefined) dbData.display_name = data.displayName;
                if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;
                if (data.preferences !== undefined) dbData.preferences = data.preferences as unknown as Json;
                if (data.scansBalance !== undefined) dbData.scans_balance = data.scansBalance;
                if (data.subscriptionPlan !== undefined) dbData.subscription_plan = data.subscriptionPlan;
                if (data.company !== undefined) dbData.company = data.company;
                if (data.industry !== undefined) dbData.industry = data.industry;
                if (data.overageCap !== undefined && data.overageCap !== 'UNLIMITED') dbData.overage_cap = data.overageCap;

                await supabase
                    .from('profiles')
                    .update(dbData)
                    .eq('id', user.id as unknown as string);
            } catch (err) {
                console.error('Failed to sync user update:', err);
            }
        }
    };

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        logout,
        updateUser,
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
