
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
    const onboardingConfig = import.meta.env.VITE_ONBOARDING_STATUS || 'false';
    const onboardingVisible = onboardingConfig !== 'false';
    const isDebug = onboardingConfig === 'debug';

    // 2. Status Resolution
    const status: OnboardingStatus = useMemo(() => {
        // If debug is on, we ignore the DB state to ALWAYS show something if needed
        if (isDebug) return DEFAULT_STATUS;
        if (!user?.onboarding_status) return DEFAULT_STATUS;
        return { ...DEFAULT_STATUS, ...(user.onboarding_status as any) };
    }, [user?.onboarding_status, isDebug]);

    // 3. Update Function
    const updateStatus = useCallback(async (key: keyof OnboardingStatus) => {
        if (!user || status[key] || !onboardingVisible) return;

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
    }, [user, status, onboardingVisible, onUpdateUser]);

    // 4. Conditional Visibility Logic
    // Step 1: Settings pulse if NOT visited settings
    const showSettingsPulse = onboardingVisible && !status.has_visited_settings;

    // Step 2: AI Config pulse ONLY if visited settings AND NOT visited AI config
    const showAiConfigPulse = onboardingVisible && status.has_visited_settings && !status.has_visited_ai_config;

    // Step 3: Create Project pulse ONLY if visited AI config AND NOT created project
    const showCreateProjectPulse = onboardingVisible && status.has_visited_ai_config && !status.has_created_first_project;

    return {
        showSettingsPulse,
        showAiConfigPulse,
        showCreateProjectPulse,
        updateStatus,
        status
    };
};
