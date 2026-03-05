
import React from 'react';
import { Zap, Plus, Crown, Briefcase, User as UserIcon, Sparkles } from 'lucide-react';
import { User, SubscriptionPlan, UIPreferences } from '../types';
import Logo from './ui/Logo';

interface HeaderProps {
  user: User;
  onBuyScans?: () => void;
  onUpgradePlan?: () => void;
  uiConfig?: UIPreferences;
}

const Header: React.FC<HeaderProps> = ({ user, onBuyScans, onUpgradePlan, uiConfig }) => {

  const glassIntensity = uiConfig?.glassIntensity || 'MEDIUM';
  const themeMode = uiConfig?.theme || 'DARK';
  const accentColor = uiConfig?.accentColor || 'blue';
  const isLight = themeMode === 'LIGHT';

  const bgOpacity = glassIntensity === 'HIGH' ? '80' : glassIntensity === 'LOW' ? '95' : '90';
  const blurClass = glassIntensity === 'HIGH' ? 'backdrop-blur-xl' : glassIntensity === 'LOW' ? 'backdrop-blur-sm' : 'backdrop-blur-md';

  // Light Mode: Pure white with transparency for a "floating header" feel
  const bgColor = isLight ? `rgba(255, 255, 255, 0.${bgOpacity === '95' ? '85' : '75'})` : `rgba(5, 5, 5, 0.${bgOpacity})`;
  const borderColor = isLight ? 'border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'border-white/5';

  // Helper to determine text and icons for plan, but STYLES now come from accentColor
  const getPlanMeta = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.ELITE:
        return { icon: <Crown size={12} className="fill-current animate-[pulse_3s_infinite]" />, label: "Elite Tier" };
      case SubscriptionPlan.TEAM:
        return { icon: <Crown size={12} className="fill-current" />, label: "Team Plan" };
      case SubscriptionPlan.PRO:
        return { icon: <Briefcase size={12} className="fill-current" />, label: "Pro Plan" };
      case SubscriptionPlan.ESSENTIAL:
        return { icon: <Zap size={12} className="fill-current" />, label: "Essential Plan" };
      default:
        return { icon: <UserIcon size={12} />, label: "Free Tier" };
    }
  };

  const planMeta = getPlanMeta(user.subscriptionPlan);

  // Dynamic Theme based on Accent Color
  const btnClass = isLight
    ? `bg-white border-${accentColor}-200 text-${accentColor}-600 hover:border-${accentColor}-300 hover:bg-${accentColor}-50 shadow-sm`
    : `bg-[#0e0e10]/80 border-${accentColor}-500/30 text-${accentColor}-400 hover:border-${accentColor}-500/60 hover:text-${accentColor}-300 shadow-${accentColor}-900/20`;

  const glowClass = `from-${accentColor}-500/20 via-transparent to-transparent`;

  return (
    <header
      className={`absolute top-0 w-full h-48 z-50 flex items-center justify-between px-6 border-b transition-all duration-300 ${blurClass} ${borderColor}`}
      style={{ backgroundColor: bgColor }}
    >

      {/* Left: Logo */}
      <div className="flex items-center gap-3 z-10 w-fit group cursor-pointer">
        <Logo variant="full" height={160} />
      </div>

      {/* Center: Premium Plan Indicator */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <button
          onClick={onUpgradePlan}
          className={`relative overflow-hidden group flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 backdrop-blur-md cursor-pointer border shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${user.subscriptionPlan === 'FREE' ? (isLight ? "bg-slate-100 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700" : "bg-white/5 border-white/10 text-zinc-400") : btnClass}`}
          title="Manage Subscription"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${glowClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-shine" />

          <div className="relative z-10 flex items-center gap-2">
            {planMeta.icon}
            <span>{planMeta.label}</span>
          </div>
        </button>
      </div>

      {/* Right: Credits */}
      <div className="flex items-center justify-end gap-4 z-10 w-48">
        <div className={`flex items-center gap-1 pl-1 pr-1 py-1 rounded-full border transition-all shadow-sm group hover:border-opacity-50 ${isLight ? 'bg-white border-slate-200/80 shadow-slate-100' : 'bg-[#0e0e10] border-white/10'} ${user.scansBalance < 10 ? 'border-red-500/50' : ''}`}>
          <div className="px-3 py-1 flex items-baseline gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-zinc-500 group-hover:text-zinc-400'}`}>Credits</span>
            <span className={`font-mono text-sm font-bold ${user.scansBalance < 10 ? 'text-red-500' : isLight ? 'text-slate-800' : 'text-white'}`}>
              {user.scansBalance.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onBuyScans}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 bg-${accentColor}-600 hover:bg-${accentColor}-500 shadow-${accentColor}-900/20`}
            title="Top up credits"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
