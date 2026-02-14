import { useState, useMemo } from 'react';
import { User } from '../types';
import { MOCK_USERS, deleteUser, generateReport, updateUser, toggleUserBan, getAdminAnalytics } from '../services/mockData';

interface UseAdminDashboardProps {
    currentUser: User;
    onNavigate: (page: string) => void;
}

export const useAdminDashboard = ({ currentUser }: UseAdminDashboardProps) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'pricing'>('overview');
    const [users, setUsers] = useState(MOCK_USERS);
    const [isExporting, setIsExporting] = useState(false);

    // Theme Helpers
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';

    // Get the new Enhanced Data Structure
    const analyticsData = useMemo(() => getAdminAnalytics(users), [users]);

    const handleDeleteUser = (userId: string) => {
        deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleUpdateUser = (updatedUser: User) => {
        updateUser(updatedUser.id, updatedUser); // Update mock database
        // Force new reference for the updated user
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...updatedUser } : u));
    };

    const handleToggleBan = (userId: string, reason?: string, duration?: string) => {
        const updated = toggleUserBan(userId, currentUser.id, reason, duration);
        if (updated) {
            // CRITICAL: We must create a shallow copy { ...updated } because the mock service
            // returns the mutated object from MOCK_USERS. React's state update won't trigger
            // a re-render if the object reference inside the array remains the same.
            setUsers(prev => prev.map(u => u.id === userId ? { ...updated } : u));
        }
    };

    const handleExportData = () => {
        setIsExporting(true);
        setTimeout(() => {
            const url = generateReport('CSV', 'ADMIN_FULL_DUMP');
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setIsExporting(false);
        }, 1000);
    };

    return {
        activeTab,
        setActiveTab,
        users,
        isExporting,
        isLight,
        textPrimary,
        analyticsData,
        handleDeleteUser,
        handleUpdateUser,
        handleToggleBan,
        handleExportData
    };
};
