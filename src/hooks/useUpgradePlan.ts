import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SubscriptionPlan } from '../types';
import { getSubscriptionPlans } from '../services/mockData';
import { PlanDetails } from '../components/cards/SubscriptionPlanCard';

interface UseUpgradePlanProps {
    onBack: () => void;
    onUpgrade: (planId: SubscriptionPlan) => void;
}

export const useUpgradePlan = ({ onBack, onUpgrade }: UseUpgradePlanProps) => {
    const { isLight, styles } = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [availablePlans, setAvailablePlans] = useState<PlanDetails[]>([]);

    useEffect(() => {
        // Fetch plans dynamically
        const plans = getSubscriptionPlans();
        // Sort by price to ensure logical ordering (Free -> Elite)
        plans.sort((a, b) => a.price - b.price);
        setAvailablePlans(plans as PlanDetails[]);
    }, []);

    const handleSelect = (planId: SubscriptionPlan) => {
        const targetPlan = availablePlans.find(p => p.id === planId);

        // Handle "Contact Us" for Elite only if price is 0 and it's NOT the Free tier
        // Current logic: If plan is ELITE and has specific handling, or just check ID
        if (targetPlan && targetPlan.price <= 0 && planId === SubscriptionPlan.ELITE) {
            window.location.href = "mailto:enterprise@airecruit.com?subject=Elite%20Plan%20Inquiry";
            return;
        }

        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            onUpgrade(planId);
            setIsProcessing(false);
            onBack();
        }, 1500);
    };

    // Calculate displayed plans based on billing cycle
    const displayPlans: PlanDetails[] = availablePlans.map(plan => {
        let price = plan.price;
        // Don't apply discount if price is 0 (Free/Contact Us)
        if (billingCycle === 'yearly' && price > 0) {
            // Apply ~20% discount for yearly
            price = Math.floor(plan.price * 0.8);
        }

        return {
            ...plan,
            price,
            period: billingCycle === 'yearly' ? '/mo' : plan.period,
        };
    });

    return {
        isLight,
        styles,
        isProcessing,
        billingCycle,
        setBillingCycle,
        displayPlans,
        handleSelect
    };
};
