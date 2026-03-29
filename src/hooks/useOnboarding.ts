
import { useState, useCallback, useMemo } from 'react';
import { supabaseClient } from '../services/supabase';
import { User, Role } from '../types';

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
    const onboardingConfig = import.meta.env.VITE_ONBOARDING_STATUS || 'false';
    const isAdmin = user?.role === Role.ADMIN;

    // Determine if onboarding should be active
    const isEnabled = useMemo(() => {
        if (onboardingConfig === 'false') return false;
        if (onboardingConfig === 'debug') return true;
        if (onboardingConfig === 'true') return true;
        return false;
    }, [onboardingConfig]);

    const status: OnboardingStatus = useMemo(() => {
        if (!user?.onboarding_status) return DEFAULT_STATUS;
        return { ...DEFAULT_STATUS, ...(user.onboarding_status as any) };
    }, [user?.onboarding_status]);

    const updateStatus = useCallback(async (key: keyof OnboardingStatus) => {
        if (!user || status[key]) return;

        const newStatus = { ...status, [key]: true };

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update({ onboarding_status: newStatus })
                .eq('id', user.id);

            if (error) throw error;

            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    onboarding_status: newStatus
                });
            }
        } catch (err) {
            console.error('Failed to update onboarding status:', err);
        }
    }, [user, status, onUpdateUser]);

    // Computed visibilities
    const showSettingsPulse = isEnabled && !status.has_visited_settings;
    const showAiConfigPulse = isEnabled && status.has_visited_settings && !status.has_visited_ai_config;
    const showCreateProjectPulse = isEnabled && status.has_visited_ai_config && !status.has_created_first_project;

    return {
        isEnabled,
        status,
        showSettingsPulse,
        showAiConfigPulse,
        showCreateProjectPulse,
        updateStatus
    };
};
