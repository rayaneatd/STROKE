import { useCallback } from 'react';
import { supabaseClient } from '../services/supabase';
import { User } from '../types';

export const useOnboarding = (user: User | null, onUpdateUser?: (updated: User) => void) => {
    // 1. Status direct depuis l'user
    const status = user?.onboarding_status || {};

    // 2. Trigger direct
    const updateOnboarding = useCallback(async (key: string) => {
        if (!user || status[key]) return;

        const newStatus = { ...status, [key]: true };

        try {
            await supabaseClient
                .from('profiles')
                .update({ onboarding_status: newStatus })
                .eq('id', user.id);

            if (onUpdateUser) {
                onUpdateUser({ ...user, onboarding_status: newStatus });
            }
        } catch (err) {
            console.error('[Onboarding] Error:', err);
        }
    }, [user, status, onUpdateUser]);

    return { status, updateOnboarding };
};
