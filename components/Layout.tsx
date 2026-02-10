
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ACCENT_PALETTES } from '../theme/designTokens';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  onBuyScans: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate, onBuyScans }) => {
  const { uiConfig, isLight, accent, styles } = useTheme();

  const getAmbientGlow = () => {
      // In Light mode, we use broader, more diffuse pastel gradients
      const glowColor = uiConfig.ambientGlow;
      if (glowColor) {
          switch (glowColor) {
              case 'amber': return isLight ? 'bg-amber-400/20' : 'bg-amber-600/10';
              case 'rose': return isLight ? 'bg-rose-400/20' : 'bg-rose-600/10';
              case 'violet': return isLight ? 'bg-violet-400/20' : 'bg-violet-600/10'; 
              case 'emerald': return isLight ? 'bg-emerald-400/20' : 'bg-emerald-600/10';
              case 'cyan': return isLight ? 'bg-cyan-400/20' : 'bg-cyan-600/10';
              case 'blue': return isLight ? 'bg-blue-400/20' : 'bg-blue-600/10';
              case 'slate': return isLight ? 'bg-slate-300/30' : 'bg-zinc-600/10';
              default: return isLight ? 'bg-slate-200/30' : 'bg-white/5';
          }
      }
      return isLight ? 'bg-slate-200/30' : 'bg-white/5';
  };

  // Helper to get hex for selection color injection from Tailwind tokens
  // Note: ideally we map this from the token object, but a switch is safe for now
  const getSelectionColor = (color: string) => {
      switch(color) {
          case 'amber': return '#f59e0b';
          case 'rose': return '#f43f5e';
          case 'violet': return '#8b5cf6';
          case 'emerald': return '#10b981';
          case 'cyan': return '#06b6d4';
          case 'blue': return '#0ea5e9';
          case 'slate': return '#64748b';
          default: return '#64748b';
      }
  };

  return (
    <div className={`min-h-screen ${styles.bg.app} flex flex-col font-sans ${styles.text.primary} relative overflow-hidden transition-colors duration-500 selection:text-white`}>
      
      {/* Dynamic Style Injection for selection color & scrollbars */}
      <style>{`
        ::selection {
            background-color: ${getSelectionColor(accent)}${isLight ? 'cc' : '40'}; 
            color: ${isLight ? 'white' : 'inherit'};
        }
        
        ${isLight ? `
          ::-webkit-scrollbar-thumb {
            background-color: #cbd5e1; 
            border: 2px solid #FAFAFA;
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
          }
        ` : ''}

        ${uiConfig.reducedMotion ? `
             *, *::before, *::after {
               animation-duration: 0.01ms !important;
               animation-iteration-count: 1 !important;
               transition-duration: 0.01ms !important;
               scroll-behavior: auto !important;
             }
        ` : ''}
      `}</style>

      {/* Dynamic Atmospheric Glow */}
      <div className={`fixed top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${getAmbientGlow()} ${isLight ? 'opacity-60 mix-blend-multiply' : 'opacity-100'}`} />
      
      {/* Secondary darker bottom glow for depth */}
      <div className={`fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none ${isLight ? 'bg-white/0' : 'bg-zinc-900/20'}`} />

      <Header 
        user={user} 
        onBuyScans={onBuyScans} 
        onUpgradePlan={() => onNavigate('upgrade-plan')} 
        uiConfig={uiConfig}
      />
      
      <div className="flex flex-1 pt-16 relative z-10">
        <Sidebar 
          currentUser={user} 
          onLogout={onLogout} 
          currentPage={currentPage}
          onNavigate={onNavigate}
          uiConfig={uiConfig}
        />
        
        <main className="flex-1 ml-64 relative overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 overflow-auto no-scrollbar">
                <div className="p-8 md:p-12 max-w-screen-2xl mx-auto min-h-full animate-fade-in pb-24">
                    {children}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
