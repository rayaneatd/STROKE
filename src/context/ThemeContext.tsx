
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, AccentColor, getSemanticStyles } from '../theme/designTokens';
import { UIPreferences } from '../types';

interface ThemeContextType {
    mode: ThemeMode;
    accent: AccentColor;
    isLight: boolean;
    styles: ReturnType<typeof getSemanticStyles>;
    updateTheme: (config: Partial<UIPreferences>) => void;
    uiConfig: UIPreferences;
}

const DEFAULT_UI_CONFIG: UIPreferences = {
    theme: 'DARK',
    ambientGlow: 'slate',
    accentColor: 'slate',
    reducedMotion: false,
    glassIntensity: 'MEDIUM',
    density: 'COMFORTABLE'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode, initialConfig?: UIPreferences, onConfigChange?: (c: UIPreferences) => void }> = ({ 
    children, 
    initialConfig,
    onConfigChange 
}) => {
    const [uiConfig, setUiConfig] = useState<UIPreferences>(initialConfig || DEFAULT_UI_CONFIG);

    useEffect(() => {
        if (initialConfig) {
            setUiConfig(initialConfig);
        }
    }, [initialConfig]);

    const updateTheme = (newConfig: Partial<UIPreferences>) => {
        const merged = { ...uiConfig, ...newConfig };
        setUiConfig(merged);
        if (onConfigChange) {
            onConfigChange(merged);
        }
    };

    const mode = uiConfig.theme;
    const accent = uiConfig.accentColor;
    const styles = getSemanticStyles(mode, accent);

    return (
        <ThemeContext.Provider value={{
            mode,
            accent,
            isLight: mode === 'LIGHT',
            styles,
            updateTheme,
            uiConfig
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
