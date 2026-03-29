
import { useState, useCallback, useMemo } from 'react';
import { supabaseClient } from '../services/supabase';
import { User } from '../types';

export interface OnboardingStatus {
    has_visited_settings: boolean;
    has_visited_ai_config: boolean;
    has_created_first_project: boolean;
}

const DEFAULT_STATUS: OnboardingStatus = {
    has_visited_settings: false,
    has_visited_ai_config: false,
    has_created_first_project: false
};

export const useOnboarding = (user: User | null, onUpdateUser?: (updated: User) => void) => {
    // 1. Config Check
    const onboardingEnabled = import.meta.env.VITE_ONBOARDING_STATUS !== 'false';
    const isDebug = import.meta.env.VITE_ONBOARDING_STATUS === 'debug';

    // 2. Status Resolution
    const status: OnboardingStatus = useMemo(() => {
        if (!user?.onboarding_status) return DEFAULT_STATUS;
        return { ...DEFAULT_STATUS, ...(user.onboarding_status as any) };
    }, [user?.onboarding_status]);

    // 3. Update Function
    const updateStatus = useCallback(async (key: keyof OnboardingStatus) => {
        if (!user || status[key] || !onboardingEnabled) return;

        const newStatus = { ...status, [key]: true };

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update({ onboarding_status: newStatus })
                .eq('id', user.id);

            if (error) throw error;
            if (onUpdateUser) onUpdateUser({ ...user, onboarding_status: newStatus });
        } catch (err) {
            console.error('[Onboarding] Update failed:', err);
        }
    }, [user, status, onboardingEnabled, onUpdateUser]);

    // 4. Conditional Visibility Logic
    // Step 1: Settings pulse if NOT visited settings
    const showSettingsPulse = onboardingEnabled && !status.has_visited_settings;

    // Step 2: AI Config pulse ONLY if visited settings AND NOT visited AI config
    const showAiConfigPulse = onboardingEnabled && status.has_visited_settings && !status.has_visited_ai_config;

    // Step 3: Create Project pulse ONLY if visited AI config AND NOT created project
    const showCreateProjectPulse = onboardingEnabled && status.has_visited_ai_config && !status.has_created_first_project;

    return {
        showSettingsPulse,
        showAiConfigPulse,
        showCreateProjectPulse,
        updateStatus,
        status
    };
};
