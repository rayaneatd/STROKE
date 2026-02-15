
import React from 'react';
import { LayoutDashboard, FolderKanban, Users, Shield, LogOut, Settings, CreditCard } from 'lucide-react';
import { User, Role, SubscriptionPlan, UIPreferences } from '../types';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface SidebarProps {
  currentUser: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  uiConfig?: UIPreferences;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout, currentPage, onNavigate, uiConfig }) => {
  const { t } = useTranslation(); // Initialize translation hook
  
  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} /> },
    { id: 'projects', label: t('nav.projects'), icon: <FolderKanban size={18} /> },
    { id: 'connections', label: t('nav.connections'), icon: <Users size={18} /> },
    { id: 'settings', label: t('nav.settings'), icon: <Settings size={18} /> },
  ];

  if (currentUser.role === Role.ADMIN) {
    navItems.push({ id: 'admin', label: t('nav.admin'), icon: <Shield size={18} /> });
  }

  // Preferences extraction
  const density = uiConfig?.density || 'COMFORTABLE';
  const glassIntensity = uiConfig?.glassIntensity || 'MEDIUM';
  const themeMode = uiConfig?.theme || 'DARK';
  const accentColor = uiConfig?.accentColor || 'blue';
  const isLight = themeMode === 'LIGHT';

  // Dynamic Styles
  const itemPadding = density === 'COMPACT' ? 'py-1.5' : 'py-2.5';
  const gapSize = density === 'COMPACT' ? 'space-y-1' : 'space-y-1.5';
  
  const bgOpacity = glassIntensity === 'HIGH' ? '80' : glassIntensity === 'LOW' ? '95' : '90';
  const blurClass = glassIntensity === 'HIGH' ? 'backdrop-blur-xl' : glassIntensity === 'LOW' ? 'backdrop-blur-sm' : 'backdrop-blur-md';
  
  // Light Mode: Use a highly translucent white for a "frosted glass" look
  // Dark Mode: Deep black/zinc
  const bgColor = isLight ? `rgba(255, 255, 255, 0.${bgOpacity === '95' ? '85' : '75'})` : `rgba(5, 5, 5, 0.${bgOpacity})`; 
  
  const borderColor = isLight ? 'border-slate-200/70 shadow-[1px_0_20px_rgba(0,0,0,0.02)]' : 'border-white/5';
  const textColor = isLight ? 'text-slate-500 font-medium' : 'text-zinc-500';
  const hoverText = isLight ? 'group-hover:text-slate-900' : 'group-hover:text-zinc-300';
  
  // Dynamic Theme Generation based on Accent Color
  const getThemeClasses = (color: string) => {
      const c = color || 'blue';
      
      // Light Mode Active State: Subtle tinted background + Strong text color + Left border indicator
      if (isLight) {
          return {
              active: `bg-${c}-50 text-${c}-700 shadow-sm ring-1 ring-${c}-200`,
              activeSimple: `bg-${c}-50/80 text-${c}-700`, // Slightly softer
              iconActive: `text-${c}-600`,
              hover: `hover:bg-slate-100 hover:text-slate-900`,
          };
      }

      // Dark Mode Active State: Glowing background
      return {
          active: `bg-${c}-500/10 text-${c}-500 border-${c}-500/20 shadow-[0_0_15px_rgba(var(--color-${c}-500),0.15)]`,
          activeSimple: `bg-${c}-500/10 text-${c}-500 border-${c}-500/20 shadow-sm`,
          iconActive: `text-${c}-500`,
          hover: `hover:bg-${c}-500/5 hover:text-${c}-600`,
      };
  };

  const theme = getThemeClasses(accentColor);

  return (
    <aside 
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r flex flex-col justify-between p-4 z-40 transition-all duration-300 ${blurClass} ${borderColor}`}
        style={{ backgroundColor: bgColor }}
    >
      <div className={`${gapSize} mt-2`}>
        {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 ${itemPadding} rounded-xl transition-all duration-200 group border border-transparent ${
                  isActive 
                    ? theme.activeSimple
                    : `${textColor} ${isLight ? 'hover:bg-slate-100/80 hover:text-slate-900' : 'hover:bg-white/5 hover:text-zinc-200'}`
                }`}
              >
                <span className={`transition-colors duration-200 ${isActive ? theme.iconActive : hoverText} ${isActive && isLight ? 'drop-shadow-sm' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                
                {/* Active Indicator Dot */}
                {isActive && (
                    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isLight ? `bg-${accentColor}-500` : `bg-${accentColor}-500 animate-pulse`}`} />
                )}
              </button>
            );
        })}
      </div>

      <div className="mb-2 space-y-2">
        {/* Quick Upgrade CTA if not Elite */}
        {currentUser.subscriptionPlan !== SubscriptionPlan.ELITE && (
            <button 
                onClick={() => onNavigate('upgrade-plan')}
                className={`w-full p-3 rounded-xl border border-dashed flex items-center gap-3 text-xs font-bold transition-all group ${
                    isLight 
                    ? 'border-slate-300/60 bg-slate-50/50 text-slate-500 hover:bg-white hover:border-slate-300 hover:text-slate-800 hover:shadow-sm' 
                    : 'border-white/10 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 hover:border-white/20'
                }`}
            >
                <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-white/5'}`}>
                    <CreditCard size={14} />
                </div>
                <span>Upgrade Plan</span>
            </button>
        )}

        <div 
          className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
              isLight 
              ? 'bg-white/60 border-slate-200/60 hover:bg-white hover:shadow-md hover:border-slate-300/80' 
              : 'bg-[#0e0e10] border-white/10 hover:bg-[#18181b]'
          } hover:border-${accentColor}-500/30`}
          onClick={() => onNavigate('profile')}
        >
          {/* Subtle glow behind profile based on accent */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r from-transparent via-${accentColor}-500 to-transparent`} />

          <div className="relative flex-shrink-0 z-10">
            <img 
              src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} 
              alt="Profile" 
              className={`w-9 h-9 rounded-full border-2 object-cover transition-colors ${
                  isLight 
                  ? `border-white shadow-sm group-hover:border-${accentColor}-200`
                  : `border-${accentColor}-500/20 group-hover:border-${accentColor}-500/50`
              }`}
            />
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 bg-${accentColor}-500 ${isLight ? 'border-white' : 'border-[#0e0e10]'}`}></div>
          </div>
          <div className="flex-1 overflow-hidden z-10">
            <p className={`text-xs font-bold truncate transition-colors ${isLight ? 'text-slate-800' : 'text-white group-hover:text-zinc-200'}`}>{currentUser.displayName}</p>
            <p className={`text-[10px] truncate font-medium ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>{currentUser.email}</p>
          </div>
          <div 
            onClick={(e) => { e.stopPropagation(); onLogout(); }}
            className={`p-1.5 rounded-lg transition-colors z-10 ${isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-rose-500' : 'hover:bg-white/10 text-zinc-600 hover:text-zinc-200'}`}
            title="Logout"
          >
            <LogOut size={14} />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
