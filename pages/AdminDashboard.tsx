
import React, { useState, useMemo } from 'react';
import { 
  Users, Activity, DollarSign, RefreshCw, Download, BarChart2
} from 'lucide-react';
import { User } from '../types';
import { MOCK_USERS, deleteUser, generateReport, updateUser, toggleUserBan, getAdminAnalytics } from '../services/mockData';

// Import Tab Components
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminSystem from '../components/admin/AdminSystem';
import AdminPricing from '../components/admin/AdminPricing';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate }) => {
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

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold flex items-center gap-3 tracking-tight ${textPrimary}`}>
                        Management Console
                        <span className={`px-3 py-1 bg-brand-500/10 text-brand-400 text-xs font-bold uppercase tracking-wider rounded-full border border-brand-500/20 ${isLight ? 'bg-brand-50 border-brand-200 text-brand-600' : ''}`}>
                            {activeTab}
                        </span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/5'}`}>
                        {['overview', 'users', 'pricing', 'system'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                                    activeTab === tab 
                                    ? (isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-sm') 
                                    : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-500 hover:text-zinc-300')
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleExportData}
                        disabled={isExporting}
                        className={`p-2.5 border rounded-xl transition-colors shadow-lg ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}
                    >
                        {isExporting ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <AdminOverview data={analyticsData} totalUsers={users.length} isLight={isLight} />
            )}

            {activeTab === 'users' && (
                <AdminUsers 
                    users={users} 
                    currentUser={currentUser}
                    onDeleteUser={handleDeleteUser} 
                    onUpdateUser={handleUpdateUser}
                    onToggleBan={handleToggleBan}
                />
            )}

            {activeTab === 'pricing' && (
                <AdminPricing isLight={isLight} />
            )}

            {activeTab === 'system' && (
                <AdminSystem isLight={isLight} />
            )}
        </div>
    );
};

export default AdminDashboard;
