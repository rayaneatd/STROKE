import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import fullLogo from '../../assets/full-logo.svg';
import iconLogo from '../../assets/icon-logo.svg';
import textLogo from '../../assets/text-logo.svg';

interface LogoProps {
    variant?: 'full' | 'icon' | 'text';
    className?: string;
    width?: number | string;
    height?: number | string;
    glow?: boolean;
}

const ACCENT_GLOWS: Record<string, string> = {
    amber: 'bg-amber-500/20',
    rose: 'bg-rose-500/20',
    violet: 'bg-violet-500/20',
    emerald: 'bg-emerald-500/20',
    cyan: 'bg-cyan-500/20',
    blue: 'bg-blue-500/20',
    slate: 'bg-slate-500/20',
};

const ACCENT_SHADOWS_DARK: Record<string, string> = {
    amber: 'drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    rose: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]',
    violet: 'drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]',
    emerald: 'drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    cyan: 'drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    blue: 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    slate: 'drop-shadow-[0_0_15px_rgba(113,113,122,0.5)]',
};

const ACCENT_SHADOWS_LIGHT: Record<string, string> = {
    amber: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    rose: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    violet: 'drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]',
    emerald: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    cyan: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]',
    blue: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]',
    slate: 'drop-shadow-[0_0_8px_rgba(100,116,139,0.3)]',
};

const Logo: React.FC<LogoProps> = ({ 
    variant = 'full', 
    className = '', 
    width, 
    height,
    glow = true 
}) => {
    const { isLight, accent } = useTheme();
    const accentColor = accent || 'blue'; // Fallback to blue if undefined

    // Resolve the correct image source
    const src = variant === 'icon' ? iconLogo : variant === 'text' ? textLogo : fullLogo;

    // Dimensions logic
    // If neither width nor height provided, default to height 40 to prevent layout shift
    // otherwise respect the provided dimension and let the other be auto (native aspect ratio)
    const imgStyle: React.CSSProperties = {
        width,
        height
    };

    if (!width && !height) {
        imgStyle.height = 40;
        // width will be auto by default for img
    }

    const w = imgStyle.width;
    const h = imgStyle.height;

    // Glow Effect Logic
    // Use mapped classes to ensure Tailwind generates them correctly
    const glowClass = glow 
        ? isLight 
            ? (ACCENT_SHADOWS_LIGHT[accentColor] || ACCENT_SHADOWS_LIGHT['blue'])
            : (ACCENT_SHADOWS_DARK[accentColor] || ACCENT_SHADOWS_DARK['blue'])
        : '';

    // Invert for Light Mode if the logo is white-based (common in dark-themed apps)
    const filterClass = isLight ? 'invert brightness-0' : '';

    // Background glow class (only for dark mode usually, or subtle in light)
    // We only apply it in dark mode as per original logic, but now safely mapped
    const bgGlowClass = ACCENT_GLOWS[accentColor] || ACCENT_GLOWS['blue'];

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            {/* Ambient Glow Background (optional extra neon) */}
            {glow && !isLight && (
                <div 
                    className={`absolute inset-0 ${bgGlowClass} blur-xl rounded-full opacity-50 pointer-events-none`}
                    style={{ transform: 'scale(1.5)' }}
                />
            )}
            
            <img 
                src={src} 
                alt="STROKE Logo" 
                style={{ width: w, height: h, objectFit: 'contain' }}
                className={`relative z-10 transition-all duration-300 ${glowClass} ${filterClass}`} 
            />
        </div>
    );
};

export default Logo;
