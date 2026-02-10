
import React from 'react';
import { Check, Star } from 'lucide-react';
import { SubscriptionPlan } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    price: number;
    period: string; // '/mo' or '/yr'
    description: string;
    features: string[];
    recommended?: boolean;
    colorTheme: 'slate' | 'blue' | 'purple' | 'amber' | 'emerald';
}

interface SubscriptionPlanCardProps {
    plan: PlanDetails;
    currentPlanId: SubscriptionPlan;
    onSelect: (planId: SubscriptionPlan) => void;
    isLoading?: boolean;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({ 
    plan, 
    currentPlanId, 
    onSelect, 
    isLoading 
}) => {
    const { isLight } = useTheme();
    const isCurrent = plan.id === currentPlanId;

    const getThemeClasses = (color: string) => {
        // Defines the specific color mappings for each theme
        // Light: Uses standard 50-700 range
        // Dark: Uses 500-900 range with gradients
        
        switch (color) {
            case 'amber':
                return isLight ? {
                    border: 'border-amber-200',
                    headerBg: 'bg-amber-50',
                    iconBg: 'bg-amber-100 text-amber-600',
                    button: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200',
                    activeBorder: 'ring-2 ring-amber-500 border-amber-500',
                    textAccent: 'text-amber-700'
                } : {
                    border: 'border-amber-500/20',
                    headerBg: 'bg-amber-950/20',
                    iconBg: 'bg-amber-500/10 text-amber-400',
                    button: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-900/40 hover:from-amber-500 hover:to-orange-500',
                    activeBorder: 'ring-1 ring-amber-500/50 border-amber-500 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]',
                    textAccent: 'text-amber-400'
                };
            case 'purple':
                return isLight ? {
                    border: 'border-purple-200',
                    headerBg: 'bg-purple-50',
                    iconBg: 'bg-purple-100 text-purple-600',
                    button: 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200',
                    activeBorder: 'ring-2 ring-purple-500 border-purple-500',
                    textAccent: 'text-purple-700'
                } : {
                    border: 'border-purple-500/20',
                    headerBg: 'bg-purple-950/20',
                    iconBg: 'bg-purple-500/10 text-purple-400',
                    button: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-900/40 hover:from-purple-500 hover:to-indigo-500',
                    activeBorder: 'ring-1 ring-purple-500/50 border-purple-500 shadow-[0_0_30px_-5px_rgba(147,51,234,0.3)]',
                    textAccent: 'text-purple-400'
                };
            case 'blue':
                return isLight ? {
                    border: 'border-blue-200',
                    headerBg: 'bg-blue-50',
                    iconBg: 'bg-blue-100 text-blue-600',
                    button: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200',
                    activeBorder: 'ring-2 ring-blue-500 border-blue-500',
                    textAccent: 'text-blue-700'
                } : {
                    border: 'border-blue-500/20',
                    headerBg: 'bg-blue-950/20',
                    iconBg: 'bg-blue-500/10 text-blue-400',
                    button: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-900/40 hover:from-blue-500 hover:to-cyan-500',
                    activeBorder: 'ring-1 ring-blue-500/50 border-blue-500 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
                    textAccent: 'text-blue-400'
                };
            case 'emerald':
                return isLight ? {
                    border: 'border-emerald-200',
                    headerBg: 'bg-emerald-50',
                    iconBg: 'bg-emerald-100 text-emerald-600',
                    button: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200',
                    activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
                    textAccent: 'text-emerald-700'
                } : {
                    border: 'border-emerald-500/20',
                    headerBg: 'bg-emerald-950/20',
                    iconBg: 'bg-emerald-500/10 text-emerald-400',
                    button: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-500',
                    activeBorder: 'ring-1 ring-emerald-500/50 border-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]',
                    textAccent: 'text-emerald-400'
                };
            default: // Slate
                return isLight ? {
                    border: 'border-slate-200',
                    headerBg: 'bg-slate-50',
                    iconBg: 'bg-white text-slate-600 border border-slate-200',
                    button: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm',
                    activeBorder: 'ring-2 ring-slate-400 border-slate-400',
                    textAccent: 'text-slate-700'
                } : {
                    border: 'border-white/10',
                    headerBg: 'bg-white/5',
                    iconBg: 'bg-white/10 text-zinc-400',
                    button: 'bg-white text-black hover:bg-zinc-200 shadow-white/10',
                    activeBorder: 'ring-1 ring-zinc-500 border-zinc-400',
                    textAccent: 'text-zinc-300'
                };
        }
    };

    const theme = getThemeClasses(plan.colorTheme);
    const cardBg = isLight ? 'bg-white' : 'bg-[#0e0e10]';
    const textColor = isLight ? 'text-slate-900' : 'text-white';
    const subTextColor = isLight ? 'text-slate-500' : 'text-zinc-400';
    const dividerColor = isLight ? 'bg-slate-100' : 'bg-white/5';

    return (
        <div className={`relative flex flex-col rounded-3xl border transition-all duration-300 ${cardBg} ${isCurrent ? theme.activeBorder : `${theme.border} hover:shadow-xl hover:-translate-y-1`} ${plan.recommended ? 'scale-105 z-10 shadow-2xl' : 'shadow-sm'}`}>
            {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1 border border-zinc-200">
                    <Star size={12} className="fill-yellow-500 text-yellow-500" /> RECOMMENDED
                </div>
            )}

            <div className={`p-8 pb-4 rounded-t-3xl ${theme.headerBg} border-b ${theme.border}`}>
                <h3 className={`text-xl font-bold mb-2 ${textColor}`}>{plan.name}</h3>
                <p className={`${subTextColor} text-sm mb-6 h-10 line-clamp-2`}>{plan.description}</p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${textColor}`}>${plan.price}</span>
                    <span className={`${subTextColor} font-medium`}>{plan.period}</span>
                </div>
            </div>

            <div className="p-8 pt-4 flex-1 flex flex-col">
                <div className={`w-full h-px ${dividerColor} mb-6`}></div>
                <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feat, i) => (
                        <li key={i} className={`flex items-start gap-3 text-sm ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                            <div className={`mt-0.5 p-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-zinc-400'}`}>
                                <Check size={12} strokeWidth={3} />
                            </div>
                            {feat}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={() => !isCurrent && onSelect(plan.id)}
                    disabled={isCurrent || isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${isCurrent ? (isLight ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-white/5 text-zinc-500 border border-white/5') : theme.button}`}
                >
                    {isLoading && !isCurrent ? 'Processing...' : isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPlanCard;
