
import React from 'react';
import { AlertTriangle, Coins, Zap, ArrowRight, Wallet } from 'lucide-react';
import { Project } from '../types';

interface ProjectBudgetBannerProps {
    project: Project;
    ownerBalance: number;
    onFundProject: () => void;
    onBuyCredits: () => void;
}

const ProjectBudgetBanner: React.FC<ProjectBudgetBannerProps> = ({ 
    project, 
    ownerBalance, 
    onFundProject,
    onBuyCredits
}) => {
    // Logic only applies if billing mode is PROJECT_INVESTMENT
    if (project.settings.billingMode !== 'PROJECT_INVESTMENT') return null;

    const currentBudget = project.investmentBalance;
    const totalInvested = project.totalInvested || project.investmentBalance || 1; // Fallback to avoid div by zero
    
    // Calculate percentage remaining
    const percentRemaining = (currentBudget / totalInvested) * 100;

    const averageFundingEstimate = Math.max(50, totalInvested * 0.2); 
    const ownerHasLowCredits = ownerBalance < averageFundingEstimate;
    const ownerHasCredits = ownerBalance > 0;

    // Condition 2: Critical (15-20%) AND Owner Low Credits
    if (percentRemaining <= 20 && ownerHasLowCredits) {
        return (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-6 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-r border-red-500/20">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/20 rounded-full text-red-500 shrink-0 mt-0.5 border border-red-500/20">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-red-400">Critical: Project & Wallet Funds Low</h3>
                        <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                            Project budget is at <span className="font-bold">{Math.round(percentRemaining)}%</span> and your wallet is running low. 
                            To prevent interruption, please purchase credits and allocate funds.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={onBuyCredits}
                        className="px-4 py-2 bg-white/5 text-red-300 text-xs font-bold border border-red-500/30 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                        <Zap size={14} className="fill-current"/> Buy Credits
                    </button>
                    <button 
                        onClick={onFundProject}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-900/20 flex items-center gap-1"
                    >
                        <Coins size={14} /> Fund Project
                    </button>
                </div>
            </div>
        );
    }

    // Condition 1: Warning (10%) AND Owner Has Credits
    if (percentRemaining <= 10 && ownerHasCredits) {
        return (
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm mb-6 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-r border-amber-500/20">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-full text-amber-500 shrink-0 mt-0.5 border border-amber-500/20">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-400">Project Budget Depleted</h3>
                        <p className="text-xs text-amber-300/80 mt-1">
                            Only <span className="font-bold">{Math.round(percentRemaining)}%</span> of the allocated budget remains. 
                            Transfer credits from your wallet to keep this project active.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onFundProject}
                    className="px-5 py-2.5 bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 rounded-lg transition-colors shadow-lg shadow-amber-500/10 flex items-center gap-2 shrink-0"
                >
                    <Coins size={14} /> Allocate Funds <ArrowRight size={14} />
                </button>
            </div>
        );
    }

    return null;
};

export default ProjectBudgetBanner;
