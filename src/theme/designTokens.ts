
// --- DESIGN TOKENS & COLOR SYSTEM ---

export type ThemeMode = 'LIGHT' | 'DARK';
export type AccentColor = 'slate' | 'blue' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'amber';

// 1. Color Palettes (Tailwind mapping)
export const ACCENT_PALETTES: Record<AccentColor, {
    50: string; 100: string; 200: string; 300: string; 400: string;
    500: string; 600: string; 700: string; 800: string; 900: string;
}> = {
    slate:   { 50: 'slate-50', 100: 'slate-100', 200: 'slate-200', 300: 'slate-300', 400: 'slate-400', 500: 'zinc-500', 600: 'zinc-600', 700: 'zinc-700', 800: 'zinc-800', 900: 'zinc-900' },
    blue:    { 50: 'blue-50', 100: 'blue-100', 200: 'blue-200', 300: 'blue-300', 400: 'blue-400', 500: 'blue-500', 600: 'blue-600', 700: 'blue-700', 800: 'blue-800', 900: 'blue-900' },
    cyan:    { 50: 'cyan-50', 100: 'cyan-100', 200: 'cyan-200', 300: 'cyan-300', 400: 'cyan-400', 500: 'cyan-500', 600: 'cyan-600', 700: 'cyan-700', 800: 'cyan-800', 900: 'cyan-900' },
    emerald: { 50: 'emerald-50', 100: 'emerald-100', 200: 'emerald-200', 300: 'emerald-300', 400: 'emerald-400', 500: 'emerald-500', 600: 'emerald-600', 700: 'emerald-700', 800: 'emerald-800', 900: 'emerald-900' },
    violet:  { 50: 'violet-50', 100: 'violet-100', 200: 'violet-200', 300: 'violet-300', 400: 'violet-400', 500: 'violet-500', 600: 'violet-600', 700: 'violet-700', 800: 'violet-800', 900: 'violet-900' },
    rose:    { 50: 'rose-50', 100: 'rose-100', 200: 'rose-200', 300: 'rose-300', 400: 'rose-400', 500: 'rose-500', 600: 'rose-600', 700: 'rose-700', 800: 'rose-800', 900: 'rose-900' },
    amber:   { 50: 'amber-50', 100: 'amber-100', 200: 'amber-200', 300: 'amber-300', 400: 'amber-400', 500: 'amber-500', 600: 'amber-600', 700: 'amber-700', 800: 'amber-800', 900: 'amber-900' },
};

// 2. Semantic Variables Generator
export const getSemanticStyles = (mode: ThemeMode, accent: AccentColor) => {
    const isLight = mode === 'LIGHT';
    const a = ACCENT_PALETTES[accent]; // Accent palette shorthand

    return {
        // Layout Backgrounds
        bg: {
            app: isLight ? 'bg-[#FAFAFA]' : 'bg-[#050505]',
            card: isLight ? 'bg-white' : 'bg-[#0e0e10]',
            cardHover: isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5',
            surface: isLight ? 'bg-slate-50' : 'bg-[#18181b]',
            surfaceHover: isLight ? 'hover:bg-slate-100' : 'hover:bg-[#27272a]',
            accentLight: `bg-${a[50]}`,
            accentMain: `bg-${a[500]}`,
            accentDark: `bg-${a[600]}`,
            accentTransparent: `bg-${a[500]}/10`,
        },
        // Borders
        border: {
            base: isLight ? 'border-slate-200' : 'border-white/5',
            highlight: isLight ? 'border-slate-300' : 'border-white/10',
            accent: `border-${a[500]}`,
            accentDim: `border-${a[500]}/20`,
        },
        // Text Colors
        text: {
            primary: isLight ? 'text-slate-900' : 'text-white',
            secondary: isLight ? 'text-slate-500' : 'text-zinc-500',
            tertiary: isLight ? 'text-slate-400' : 'text-zinc-600',
            accent: `text-${a[500]}`,
            accentHover: `hover:text-${a[600]}`,
            onAccent: 'text-white',
        },
        // Effects
        shadow: {
            sm: isLight ? 'shadow-sm shadow-slate-200/50' : 'shadow-sm shadow-black/50',
            md: isLight ? 'shadow-md shadow-slate-200/50' : 'shadow-md shadow-black/50',
            lg: isLight ? 'shadow-lg shadow-slate-300/50' : 'shadow-lg shadow-black/80',
            accent: `shadow-${a[500]}/20`,
        }
    };
};

// 3. Component Specific Styles (Primitives)
export const PRIMITIVES = {
    card: (mode: ThemeMode) => mode === 'LIGHT' 
        ? 'bg-white border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)]' 
        : 'bg-[#0e0e10] border-white/5 shadow-sm',
    
    input: (mode: ThemeMode, accent: AccentColor) => mode === 'LIGHT'
        ? `bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-${ACCENT_PALETTES[accent][500]} focus:ring-1 focus:ring-${ACCENT_PALETTES[accent][500]}`
        : `bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus:border-${ACCENT_PALETTES[accent][500]} focus:ring-1 focus:ring-${ACCENT_PALETTES[accent][500]}/50`,
    
    buttonPrimary: (accent: AccentColor) => 
        `bg-${ACCENT_PALETTES[accent][600]} hover:bg-${ACCENT_PALETTES[accent][500]} text-white shadow-lg shadow-${ACCENT_PALETTES[accent][900]}/20`,
    
    buttonSecondary: (mode: ThemeMode) => mode === 'LIGHT'
        ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
        : 'bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white',
    
    badge: (mode: ThemeMode, accent: AccentColor) => mode === 'LIGHT'
        ? `bg-${ACCENT_PALETTES[accent][50]} text-${ACCENT_PALETTES[accent][600]} border-${ACCENT_PALETTES[accent][200]}`
        : `bg-${ACCENT_PALETTES[accent][500]}/10 text-${ACCENT_PALETTES[accent][400]} border-${ACCENT_PALETTES[accent][500]}/20`
};
