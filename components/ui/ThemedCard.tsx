
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { PRIMITIVES } from '../../theme/designTokens';

interface ThemedCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const ThemedCard: React.FC<ThemedCardProps> = ({ children, className = '', onClick }) => {
    const { mode } = useTheme();
    const baseClass = PRIMITIVES.card(mode);

    return (
        <div 
            onClick={onClick}
            className={`rounded-2xl border transition-all duration-300 ${baseClass} ${className}`}
        >
            {children}
        </div>
    );
};

export default ThemedCard;
