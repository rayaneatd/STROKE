
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Shield, Edit2, Trash2, CheckCircle, ChevronDown, X, Gavel, ChevronLeft, ChevronRight, AlertOctagon, UserX, Clock } from 'lucide-react';
import { User, Role, SubscriptionPlan } from '../../types';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';
import BanUserModal from './BanUserModal';

interface AdminUsersProps {
    users: User[];
    currentUser: User;
    onDeleteUser: (userId: string) => void;
    onUpdateUser: (user: User) => void;
    onToggleBan?: (userId: string, reason?: string, duration?: string) => void;
}

const ITEMS_PER_PAGE = 10;

interface UserRowProps {
    user: User;
    currentUser: User;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onBanToggle: (user: User) => void;
    isLight?: boolean;
}

const UserRow: React.FC<UserRowProps> = React.memo(({ user, currentUser, onEdit, onDelete, onBanToggle, isLight }) => {
    const isSelf = user.id === currentUser.id;

    const rowClass = isLight ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-white/5 border-white/5';
    const textPrimary = isLight ? 'text-slate-900' : 'text-zinc-200';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    return (
        <tr className={`transition-colors group border-b last:border-0 ${rowClass} ${user.isBanned ? (isLight ? 'bg-red-50' : 'bg-red-500/10') : ''}`}>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="" className={`w-10 h-10 rounded-full border object-cover ${user.isBanned ? 'border-red-500/50 grayscale' : (isLight ? 'border-slate-200' : 'border-white/10')}`} />
                        {user.isBanned && (
                            <div className={`absolute -bottom-1 -right-1 bg-red-600 text-white p-0.5 rounded-full border-2 ${isLight ? 'border-white' : 'border-[#0e0e10]'}`}>
                                <Gavel size={10} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className={`font-bold text-sm flex items-center gap-2 ${user.isBanned ? 'text-red-500' : textPrimary}`}>
                            {user.displayName}
                            {user.isBanned && <span className="text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded uppercase tracking-wide">Banned</span>}
                            {isSelf && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-zinc-400'}`}>You</span>}
                        </div>
                        <div className={`text-xs ${textSecondary}`}>{user.email}</div>
                        {user.isBanned && (
                            <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                                <UserX size={10}/> Banned by {user.bannedBy || 'Admin'}
                                {user.banExpiresAt && (
                                    <span className="flex items-center gap-1 ml-1 text-red-400/80">
                                        • Expires {new Date(user.banExpiresAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${user.role === Role.ADMIN ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    {user.role === Role.ADMIN && <Shield size={12} />}
                    {user.role}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className={`text-sm font-medium capitalize ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    {user.subscriptionPlan.replace(/_/g, ' ').toLowerCase()}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className={`w-16 h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-zinc-800'}`}>
                        <div className={`h-full rounded-full ${user.scansBalance < 10 ? 'bg-red-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(100, (user.scansBalance / 100) * 100)}%` }}></div>
                    </div>
                    <span className={`text-xs font-bold ${textSecondary}`}>{user.scansBalance}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className={`flex justify-end gap-2 transition-opacity ${isSelf ? 'opacity-50 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button 
                        onClick={() => !isSelf && onBanToggle(user)}
                        disabled={isSelf}
                        className={`p-2 rounded-lg transition-colors ${user.isBanned ? 'text-emerald-500 hover:bg-emerald-500/10' : isLight ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10'}`} 
                        title={isSelf ? "Cannot ban yourself" : (user.isBanned ? "Restore User" : "Ban User")}
                    >
                        {user.isBanned ? <CheckCircle size={16} /> : <Gavel size={16} />}
                    </button>
                    <div className={`w-px h-4 self-center mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
                    <button 
                        onClick={() => onEdit(user)}
                        className={`p-2 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:text-brand-500 hover:bg-slate-100' : 'text-zinc-500 hover:text-brand-400 hover:bg-white/5'}`}
                        title="Edit User"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => onDelete(user)} 
                        className={`p-2 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-zinc-500 hover:text-red-400 hover:bg-white/5'}`}
                        title="Delete User"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

const AdminUsers: React.FC<AdminUsersProps> = ({ users, currentUser, onDeleteUser, onUpdateUser, onToggleBan }) => {
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
    const [planFilter, setPlanFilter] = useState<'ALL' | SubscriptionPlan>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Modal States
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    // Theme Helper
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-black/20 border-white/5 text-white placeholder:text-zinc-600';
    const selectClass = isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'border-white/10 bg-black/20 text-zinc-300';

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setIsFilterOpen(false);
        if (isFilterOpen) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isFilterOpen]);

    // Filter Users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.displayName.toLowerCase().includes(userSearch.toLowerCase()) || 
                                  u.email.toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
            const matchesPlan = planFilter === 'ALL' || u.subscriptionPlan === planFilter;
            const matchesStatus = statusFilter === 'ALL' 
                ? true 
                : statusFilter === 'BANNED' ? u.isBanned : !u.isBanned;
            
            return matchesSearch && matchesRole && matchesPlan && matchesStatus;
        });
    }, [users, userSearch, roleFilter, planFilter, statusFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [userSearch, roleFilter, planFilter, statusFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const activeFiltersCount = (roleFilter !== 'ALL' ? 1 : 0) + (planFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0);

    const handleEditClick = React.useCallback((user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteClick = React.useCallback((user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    }, []);

    const handleBanClick = React.useCallback((user: User) => {
        setSelectedUser(user);
        setIsBanModalOpen(true);
    }, []);

    const handleSaveUser = (updatedUser: User) => {
        onUpdateUser(updatedUser);
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const handleConfirmDelete = () => {
        if (selectedUser) {
            onDeleteUser(selectedUser.id);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
        }
    };

    const handleConfirmBan = (reason: string, duration: string) => {
        if (selectedUser && onToggleBan) {
            onToggleBan(selectedUser.id, reason, duration);
            setIsBanModalOpen(false);
            setSelectedUser(null);
        }
    }

    const clearFilters = () => {
        setRoleFilter('ALL');
        setPlanFilter('ALL');
        setStatusFilter('ALL');
        setUserSearch('');
    };

    return (
        <div className={`rounded-3xl border overflow-hidden animate-fade-in relative min-h-[500px] flex flex-col ${cardBg}`}>
            <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 z-20 relative ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                <div className="relative w-full sm:max-w-md">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} size={18} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${inputBg} focus:ring-1 focus:ring-brand-500/50`}
                    />
                </div>
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
                        className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-bold transition-colors ${activeFiltersCount > 0 ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' : isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500' : 'bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400'}`}
                    >
                        <Filter size={16} /> Filter
                        {activeFiltersCount > 0 && <span className="bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>}
                        <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Filter Dropdown */}
                    {isFilterOpen && (
                        <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl border p-5 z-30 animate-fade-in-up ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`} onClick={e => e.stopPropagation()}>
                            <div className="space-y-5">
                                <div>
                                    <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Account Status</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'ALL', label: 'All' }, 
                                            { id: 'ACTIVE', label: 'Active' }, 
                                            { id: 'BANNED', label: 'Banned' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setStatusFilter(opt.id as any)}
                                                className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === opt.id ? 'bg-brand-600 text-white shadow-md' : isLight ? 'bg-slate-50 text-slate-500 hover:bg-slate-100' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>User Role</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['ALL', Role.ADMIN, Role.USER].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setRoleFilter(role as any)}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${roleFilter === role ? 'bg-brand-600 text-white shadow-md' : isLight ? 'bg-slate-50 text-slate-500 hover:bg-slate-100' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                            >
                                                {role === 'ALL' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Subscription Plan</label>
                                    <select 
                                        value={planFilter}
                                        onChange={(e) => setPlanFilter(e.target.value as any)}
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:ring-1 focus:ring-brand-500/50 outline-none ${selectClass}`}
                                    >
                                        <option value="ALL" className={isLight ? "bg-white" : "bg-[#18181b]"}>All Plans</option>
                                        {Object.values(SubscriptionPlan).map(plan => (
                                            <option key={plan} value={plan} className={isLight ? "bg-white" : "bg-[#18181b]"}>{plan.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={`pt-2 border-t flex justify-end ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                    <button onClick={clearFilters} className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1">
                                        <X size={12} /> Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                    <thead className={`border-b sticky top-0 z-10 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'}`}>
                        <tr>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>User</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Role</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Plan</th>
                            <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Credits</th>
                            <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-50 bg-white' : 'divide-white/5 bg-[#0e0e10]'}`}>
                        {paginatedUsers.map(user => (
                            <UserRow 
                                key={user.id} 
                                user={user} 
                                currentUser={currentUser}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick} 
                                onBanToggle={handleBanClick}
                                isLight={isLight}
                            />
                        ))}
                        {paginatedUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <div className={`flex flex-col items-center justify-center ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
                                        <Filter size={32} className="mb-3 opacity-20" />
                                        <p className="font-medium">No users match your filters.</p>
                                        {(roleFilter !== 'ALL' || planFilter !== 'ALL' || userSearch || statusFilter !== 'ALL') && (
                                            <button onClick={clearFilters} className="mt-2 text-brand-400 font-bold text-sm hover:underline">
                                                Clear all filters
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={`p-4 border-t flex items-center justify-between ${isLight ? 'border-slate-100 bg-white' : 'border-white/5 bg-[#0e0e10]'}`}>
                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Showing <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span> of <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{filteredUsers.length}</span> users
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-transparent ${isLight ? 'text-slate-400 hover:bg-slate-50 hover:border-slate-100' : 'text-zinc-400 hover:bg-white/5 hover:border-white/5'}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${isLight ? 'bg-slate-50 text-slate-700 border-slate-100' : 'text-white bg-white/5 border-white/5'}`}>
                            {currentPage} / {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-transparent ${isLight ? 'text-slate-400 hover:bg-slate-50 hover:border-slate-100' : 'text-zinc-400 hover:bg-white/5 hover:border-white/5'}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedUser && (
                <>
                    <EditUserModal 
                        isOpen={isEditModalOpen} 
                        onClose={() => setIsEditModalOpen(false)} 
                        user={selectedUser} 
                        onSave={handleSaveUser} 
                    />
                    <DeleteUserModal 
                        isOpen={isDeleteModalOpen} 
                        onClose={() => setIsDeleteModalOpen(false)} 
                        user={selectedUser} 
                        onConfirm={handleConfirmDelete} 
                    />
                    <BanUserModal 
                        isOpen={isBanModalOpen}
                        onClose={() => setIsBanModalOpen(false)}
                        user={selectedUser}
                        onConfirm={handleConfirmBan}
                    />
                </>
            )}
        </div>
    );
};

export default AdminUsers;
