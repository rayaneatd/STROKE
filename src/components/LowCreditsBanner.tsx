
import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface LowCreditsBannerProps {
  balance: number;
  onBuy: () => void;
}

const LowCreditsBanner: React.FC<LowCreditsBannerProps> = ({ balance, onBuy }) => {
  // Only show if balance is very low (e.g., <= 20)
  if (balance > 20) return null;

  return (
    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in border-y border-r border-amber-500/20">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full text-amber-500 shrink-0 border border-amber-500/20">
                <AlertTriangle size={20} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-amber-400">Low Credits Warning</h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                    You have only <span className="font-bold">{balance} scans</span> remaining. Top up now to avoid interruption.
                </p>
            </div>
        </div>
        <button 
            onClick={onBuy}
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
        >
            Buy Scans <ChevronRight size={14} />
        </button>
    </div>
  );
};

export default LowCreditsBanner;
