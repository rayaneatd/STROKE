
import React from 'react';
import { Check, Zap, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ScanPackage {
    id: string;
    name: string;
    scans: number;
    price: number;
    features: string[];
    isPopular?: boolean;
    colorTheme: 'blue' | 'purple' | 'amber';
}

interface ScanPackageCardProps {
    pkg: ScanPackage;
    onBuy: (amount: number) => void;
    isLoading?: boolean;
}

const ScanPackageCard: React.FC<ScanPackageCardProps> = ({ pkg, onBuy, isLoading }) => {
    const { isLight } = useTheme();

    const getThemeClasses = () => {
        const isAmber = pkg.colorTheme === 'amber';
        const isPurple = pkg.colorTheme === 'purple';
        const isBlue = pkg.colorTheme === 'blue';

        if (isLight) {
            // LIGHT MODE
            if (isAmber) return {
                border: 'border-amber-200',
                headerBg: 'bg-amber-50',
                iconBg: 'bg-amber-100 text-amber-600 border border-amber-200',
                button: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200',
                accent: 'text-amber-700',
                title: 'text-slate-900',
                price: 'text-slate-900'
            };
            if (isPurple) return {
                border: 'border-purple-200',
                headerBg: 'bg-purple-50',
                iconBg: 'bg-purple-100 text-purple-600 border border-purple-200',
                button: 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200',
                accent: 'text-purple-700',
                title: 'text-slate-900',
                price: 'text-slate-900'
            };
            // Blue/Default
            return {
                border: 'border-blue-200',
                headerBg: 'bg-blue-50',
                iconBg: 'bg-blue-100 text-blue-600 border border-blue-200',
                button: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200',
                accent: 'text-blue-700',
                title: 'text-slate-900',
                price: 'text-slate-900'
            };
        } else {
            // DARK MODE
            if (isAmber) return {
                border: 'border-amber-500/20',
                headerBg: 'bg-amber-950/20',
                iconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
                button: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-900/40 hover:from-amber-500 hover:to-orange-500',
                accent: 'text-amber-500',
                title: 'text-white',
                price: 'text-white'
            };
            if (isPurple) return {
                border: 'border-purple-500/20',
                headerBg: 'bg-purple-950/20',
                iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
                button: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-900/40 hover:from-purple-500 hover:to-indigo-500',
                accent: 'text-purple-400',
                title: 'text-white',
                price: 'text-white'
            };
            // Blue/Default
            return {
                border: 'border-brand-500/20',
                headerBg: 'bg-brand-950/20',
                iconBg: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
                button: 'bg-white text-black hover:bg-zinc-200',
                accent: 'text-brand-400',
                title: 'text-white',
                price: 'text-white'
            };
        }
    };

    const theme = getThemeClasses();
    const cardBg = isLight ? 'bg-white' : 'bg-[#0e0e10]';
    const popularBadgeBg = isLight 
        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-white shadow-md' 
        : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-white/10';

    return (
        <div className={`relative flex flex-col ${cardBg} rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:border-opacity-50 hover:-translate-y-1 ${theme.border} ${pkg.isPopular ? 'shadow-lg scale-105 z-10' : 'shadow-sm'}`}>
            {pkg.isPopular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1 border ${popularBadgeBg}`}>
                    <Sparkles size={12} className="fill-current" /> BEST VALUE
                </div>
            )}

            <div className={`p-6 rounded-t-3xl border-b ${theme.border} ${theme.headerBg}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${theme.iconBg}`}>
                        <Zap size={24} className="fill-current" />
                    </div>
                    <div className="text-right">
                        <span className={`block text-2xl font-black ${theme.price}`}>${pkg.price}</span>
                        <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>One-time payment</span>
                    </div>
                </div>
                <h3 className={`text-xl font-bold ${theme.title}`}>{pkg.name}</h3>
                <p className={`text-sm font-bold ${theme.accent} mt-1`}>{pkg.scans} Scans</p>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                    {pkg.features.map((feat, i) => (
                        <li key={i} className={`flex items-start gap-3 text-sm ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                            <div className={`mt-0.5 p-0.5 rounded-full ${theme.iconBg}`}>
                                <Check size={10} strokeWidth={4} />
                            </div>
                            {feat}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={() => onBuy(pkg.scans)}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${theme.button}`}
                >
                    {isLoading ? 'Processing...' : 'Purchase Pack'}
                </button>
            </div>
        </div>
    );
};

export default ScanPackageCard;
