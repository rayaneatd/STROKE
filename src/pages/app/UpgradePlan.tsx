
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, ShieldCheck, Zap } from 'lucide-react';
import SubscriptionPlanCard from '../../components/cards/SubscriptionPlanCard';
import { SubscriptionPlan, User } from '../../types';
import { useUpgradePlan } from '../../hooks/useUpgradePlan';

interface UpgradePlanProps {
    onBack: () => void;
    onUpgrade: (planId: SubscriptionPlan) => void;
    currentUser: User;
}

const UpgradePlan: React.FC<UpgradePlanProps> = ({ onBack, onUpgrade, currentUser }) => {
    const {
        isLight,
        styles,
        isProcessing,
        billingCycle,
        setBillingCycle,
        displayPlans,
        handleSelect
    } = useUpgradePlan({ onBack, onUpgrade });

    const headerText = isLight ? 'text-slate-900' : 'text-white';
    const subText = isLight ? 'text-slate-500' : 'text-zinc-400';
    const backBtn = isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-500 hover:text-white';

    // Toggle Switch Styles
    const toggleBg = isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-[#0e0e10] border border-white/10 shadow-inner';
    const pillBg = isLight ? 'bg-slate-100 border border-slate-200' : 'bg-white/10 border border-white/5';
    const activeToggleText = isLight ? 'text-slate-900' : 'text-white';
    const inactiveToggleText = isLight ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-zinc-300';

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-10 text-center relative">
                <button onClick={onBack} className={`absolute left-0 top-0 flex items-center gap-2 text-sm font-medium transition-colors ${backBtn}`}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="max-w-3xl mx-auto pt-8">
                    <span className="text-brand-500 font-bold tracking-widest text-xs uppercase mb-2 block">Upgrade Your Workspace</span>
                    <h1 className={`text-4xl md:text-5xl font-black mb-6 tracking-tight ${headerText}`}>Choose the Plan That Fits Your Scale</h1>
                    <p className={`text-lg ${subText}`}>
                        Unlock more projects, more scans, and advanced collaboration tools. Change plans anytime.
                    </p>
                </div>
            </div>

            {/* Interactive Billing Toggle */}
            <div className="flex justify-center mb-12">
                <div className={`p-1.5 rounded-full flex items-center relative cursor-pointer ${toggleBg}`}>
                    {/* Sliding Background Pill */}
                    <div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full shadow-sm transition-all duration-300 ease-in-out ${pillBg} ${billingCycle === 'monthly' ? 'left-1.5' : 'left-[calc(50%+3px)]'
                            }`}
                    ></div>

                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`relative z-10 px-8 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 w-36 ${billingCycle === 'monthly' ? activeToggleText : inactiveToggleText
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`relative z-10 px-8 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 w-36 flex items-center justify-center gap-2 ${billingCycle === 'yearly' ? activeToggleText : inactiveToggleText
                            }`}
                    >
                        Yearly
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${billingCycle === 'yearly'
                                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                                : isLight ? 'bg-emerald-100 text-emerald-600/50' : 'bg-emerald-500/10 text-emerald-600/50'
                            }`}>
                            -20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans Grid - Dynamic Columns based on plan count */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(displayPlans.length, 5)} gap-6 items-start justify-center`}>
                {displayPlans.map((plan) => (
                    <div key={plan.id} className="relative group">
                        <SubscriptionPlanCard
                            plan={plan}
                            currentPlanId={currentUser.subscriptionPlan}
                            onSelect={handleSelect}
                            isLoading={isProcessing}
                        />
                        {/* Billed Yearly Note */}
                        {billingCycle === 'yearly' && plan.price > 0 && (
                            <div className="absolute -bottom-8 left-0 right-0 text-center animate-fade-in">
                                <span className={`text-xs font-medium ${subText}`}>
                                    Billed ${plan.price * 12} yearly
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Trust Badges */}
            <div className={`mt-24 pt-10 border-t grid grid-cols-1 md:grid-cols-3 gap-8 text-center ${styles.border.base}`}>
                <div className="flex flex-col items-center group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 border ${isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className={`font-bold ${headerText}`}>Secure & Encrypted</h3>
                    <p className={`text-sm mt-1 ${subText}`}>Enterprise-grade security for your data.</p>
                </div>
                <div className="flex flex-col items-center group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 border ${isLight ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        <CheckCircle size={24} />
                    </div>
                    <h3 className={`font-bold ${headerText}`}>Cancel Anytime</h3>
                    <p className={`text-sm mt-1 ${subText}`}>No long-term contracts or hidden fees.</p>
                </div>
                <div className="flex flex-col items-center group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 border ${isLight ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        <Zap size={24} className="fill-current" />
                    </div>
                    <h3 className={`font-bold ${headerText}`}>Instant Access</h3>
                    <p className={`text-sm mt-1 ${subText}`}>Upgrades are applied immediately.</p>
                </div>
            </div>
        </div>
    );
};

export default UpgradePlan;
