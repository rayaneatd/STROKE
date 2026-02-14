
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { PRIMITIVES } from '../../theme/designTokens';
import { Loader2 } from 'lucide-react';

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const ThemedButton: React.FC<ThemedButtonProps> = ({ 
    children, 
    variant = 'primary', 
    isLoading, 
    icon,
    className = '',
    disabled,
    ...props 
}) => {
    const { mode, accent, styles } = useTheme();

    let variantClass = '';
    
    switch (variant) {
        case 'primary':
            variantClass = PRIMITIVES.buttonPrimary(accent);
            break;
        case 'secondary':
            variantClass = PRIMITIVES.buttonSecondary(mode);
            break;
        case 'danger':
            variantClass = 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20 shadow-lg';
            break;
        case 'ghost':
            variantClass = `bg-transparent ${styles.text.secondary} ${styles.text.accentHover} hover:bg-white/5`;
            break;
    }

    return (
        <button 
            disabled={disabled || isLoading}
            className={`
                px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] 
                flex items-center justify-center gap-2 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                ${variantClass} ${className}
            `}
            {...props}
        >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : icon}
            {children}
        </button>
    );
};

export default ThemedButton;
