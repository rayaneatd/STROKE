
import React, { createContext, useContext, useState, useCallback } from 'react';
import ComingSoonModal from '../components/modals/ComingSoonModal';
import { useAuth } from './AuthContext';
import { Role } from '../types';

interface ComingSoonContextType {
    showComingSoon: () => void;
    checkComingSoon: (action: () => void) => void;
}

const ComingSoonContext = createContext<ComingSoonContextType | undefined>(undefined);

export const ComingSoonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();

    const showComingSoon = useCallback(() => {
        setIsOpen(true);
    }, []);

    const checkComingSoon = useCallback((action: () => void) => {
        if (user?.role === Role.ADMIN) {
            action();
        } else {
            setIsOpen(true);
        }
    }, [user]);

    return (
        <ComingSoonContext.Provider value={{ showComingSoon, checkComingSoon }}>
            {children}
            <ComingSoonModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </ComingSoonContext.Provider>
    );
};

export const useComingSoon = () => {
    const context = useContext(ComingSoonContext);
    if (context === undefined) {
        throw new Error('useComingSoon must be used within a ComingSoonProvider');
    }
    return context;
};
