import React from 'react';
import { ArrowLeft, ShieldCheck, Zap, CreditCard, HelpCircle, Clock, ExternalLink } from 'lucide-react';
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
        handlePurchase,
        user
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2">
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
                                <CreditCard size={16} className="text-blue-400" /> Instant Boost
                            </div>
                        </div>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
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
                                Purchased scans typically don't expire. However, some promotional bundles or high-volume subscription slots might have a 1-year window, which you can track in your history.
                            </p>
                        </div>
                        <div className={`rounded-2xl p-8 border ${faqBg}`}>
                            <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${headerText}`}>
                                <HelpCircle size={20} className={isLight ? "text-slate-400" : "text-zinc-500"} /> Team Sharing
                            </h3>
                            <p className={`text-sm leading-relaxed ${subText}`}>
                                Scans are added to the Workspace Owner's wallet. Any Admin or Partner with scanning permissions draws from this shared pool automatically.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar: History & Integration */}
                <div className="space-y-8">
                    {/* Scan History Compact */}
                    <div className={`rounded-3xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/5'}`}>
                        <div className="p-6 border-b border-inherit bg-inherit flex items-center justify-between">
                            <h3 className={`font-bold flex items-center gap-2 ${headerText}`}>
                                <Clock size={16} className="text-blue-400" /> Scan History
                            </h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            {user?.scansBalanceDetail && user.scansBalanceDetail.length > 0 ? (
                                <div className="divide-y divide-inherit">
                                    {[...user.scansBalanceDetail].reverse().map((slot, i) => {
                                        const now = new Date();
                                        const expiryDate = slot.expires_at ? new Date(slot.expires_at) : null;
                                        const isExpired = expiryDate && expiryDate < now;
                                        const isPermanent = !expiryDate;
                                        const isSoonExpiring = expiryDate && !isExpired && (expiryDate.getTime() - now.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days

                                        return (
                                            <div key={i} className={`p-4 transition-colors ${isExpired ? 'opacity-50 grayscale' : 'hover:bg-white/5'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className={`text-sm font-black ${isExpired ? 'text-slate-500 line-through' : headerText}`}>
                                                            {slot.count} Scans
                                                        </div>
                                                        <div className={`text-[10px] uppercase tracking-tighter font-bold ${subText}`}>
                                                            {slot.source}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {isExpired ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-bold uppercase">Expired</span>
                                                        ) : isPermanent ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase">Permanent</span>
                                                        ) : isSoonExpiring ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase">Expiring Soon</span>
                                                        ) : (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold uppercase">Active</span>
                                                        )}
                                                        {slot.price > 0 && (
                                                            <span className="text-[10px] font-bold text-emerald-400/80">${slot.price}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Added on</span>
                                                        <span className={`text-[10px] font-medium ${subText}`}>{new Date(slot.added_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {expiryDate && (
                                                        <div className="flex flex-col items-end text-right">
                                                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Valid until</span>
                                                            <span className={`text-[10px] font-medium ${isExpired ? 'text-red-400' : isSoonExpiring ? 'text-amber-400' : subText}`}>
                                                                {expiryDate.toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`p-10 text-center ${subText} text-xs italic`}>
                                    No scan packs found in your wallet.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BuyScans;
