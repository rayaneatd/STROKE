
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Zap, CreditCard, HelpCircle } from 'lucide-react';
import ScanPackageCard from '../../components/cards/ScanPackageCard';
import { useBuyScans } from '../../hooks/useBuyScans';

interface BuyScansProps {
    onBack: () => void;
    onBuy: (amount: number) => void;
    currentBalance: number;
}

const BuyScans: React.FC<BuyScansProps> = ({ onBack, onBuy, currentBalance }) => {
    const {
        isLight,
        isProcessing,
        packages,
        handlePurchase
    } = useBuyScans({ onBack, onBuy });

    const headerText = isLight ? 'text-slate-900' : 'text-white';
    const subText = isLight ? 'text-slate-500' : 'text-zinc-400';
    const backBtn = isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-500 hover:text-white';
    const faqBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/5';
    const statusBg = isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#0e0e10] border-white/10 shadow-2xl';

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-10">
                <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${backBtn}`}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className={`text-4xl font-black mb-4 tracking-tight ${headerText}`}>Top Up Your Scanning Power</h1>
                    <p className={`text-lg ${subText}`}>
                        Choose a package that fits your hiring volume. All scans include our advanced AI parsing engine and candidate matching technology.
                    </p>
                </div>
            </div>

            {/* Current Status Bar */}
            <div className={`border rounded-2xl p-6 mb-12 flex flex-col md:flex-row justify-between items-center ${statusBg}`}>
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className={`p-3 rounded-xl border backdrop-blur-sm ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                        <Zap size={24} className="text-yellow-400 fill-yellow-400" />
                    </div>
                    <div>
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Current Balance</div>
                        <div className={`text-2xl font-bold ${headerText}`}>{currentBalance} Scans Remaining</div>
                    </div>
                </div>
                <div className={`flex items-center gap-6 text-sm font-medium ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" /> Secure Payment
                    </div>
                    <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-400" /> Instant Credit
                    </div>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {packages.map((pkg) => (
                    <ScanPackageCard
                        key={pkg.id}
                        pkg={pkg}
                        onBuy={handlePurchase}
                        isLoading={isProcessing}
                    />
                ))}
            </div>

            {/* FAQ / Info */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`rounded-2xl p-8 border ${faqBg}`}>
                    <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${headerText}`}>
                        <HelpCircle size={20} className={isLight ? "text-slate-400" : "text-zinc-500"} /> Do scans expire?
                    </h3>
                    <p className={`text-sm leading-relaxed ${subText}`}>
                        No. Your purchased scans never expire. You can use them whenever you have an active project or need to screen new candidates.
                    </p>
                </div>
                <div className={`rounded-2xl p-8 border ${faqBg}`}>
                    <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${headerText}`}>
                        <HelpCircle size={20} className={isLight ? "text-slate-400" : "text-zinc-500"} /> Can I share scans with my team?
                    </h3>
                    <p className={`text-sm leading-relaxed ${subText}`}>
                        Yes! Scans are added to the Workspace Owner's balance. Any Admin or Employee with 'Scan' permissions draws from this central pool.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BuyScans;
