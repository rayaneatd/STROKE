
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserId } from '../types';
import { secureStorage } from '../utils/security';
import { getUser } from '../services/mockData';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Initial Load - Check secure storage
    useEffect(() => {
        const storedUser = secureStorage.getItem<User>('auth_user');
        if (storedUser) {
            // Verify session validity here (mock)
            setUser(storedUser);
        }
    }, []);

    const login = (newUser: User) => {
        setUser(newUser);
        secureStorage.setItem('auth_user', newUser);
    };

    const logout = () => {
        setUser(null);
        secureStorage.removeItem('auth_user');
    };

    const updateUser = (data: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...data };
            secureStorage.setItem('auth_user', updated);
            return updated;
        });
    };

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser
    }), [user]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
