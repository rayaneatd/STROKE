
import React, { useState, useEffect } from 'react';
import { X, Gavel, AlertTriangle, Clock, Calendar, RefreshCw } from 'lucide-react';
import { User } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface BanUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onConfirm: (reason: string, duration: string) => void;
}

const BanUserModal: React.FC<BanUserModalProps> = ({ isOpen, onClose, user, onConfirm }) => {
    const { isLight } = useTheme();
    const [reason, setReason] = useState('');
    const [durationSelection, setDurationSelection] = useState('PERMANENT');
    
    // Custom Duration State
    const [customNum, setCustomNum] = useState<number>(3);
    const [customUnit, setCustomUnit] = useState<'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS'>('DAYS');
    const [customDate, setCustomDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setReason('');
            setDurationSelection('PERMANENT');
            setCustomNum(3);
            setCustomUnit('DAYS');
            syncToDate(3, 'DAYS');
        }
    }, [isOpen]);

    // Helper to get local datetime string for input
    const getLocalISOString = (date: Date) => {
        if (isNaN(date.getTime())) return ''; // Safety check for invalid dates
        const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const syncToDate = (num: number, unit: string) => {
        if (isNaN(num)) return; // Prevent invalid arithmetic
        const now = new Date();
        const target = new Date(now);
        
        if (unit === 'HOURS') target.setHours(target.getHours() + num);
        else if (unit === 'DAYS') target.setDate(target.getDate() + num);
        else if (unit === 'WEEKS') target.setDate(target.getDate() + (num * 7));
        else if (unit === 'MONTHS') target.setMonth(target.getMonth() + num);

        setCustomDate(getLocalISOString(target));
    };

    const syncToDuration = (dateStr: string) => {
        if (!dateStr) return;
        const target = new Date(dateStr);
        if (isNaN(target.getTime())) return; // Prevent Invalid Date

        const now = new Date();
        const diffMs = target.getTime() - now.getTime();
        
        if (diffMs <= 0) return; 

        const hours = diffMs / (1000 * 60 * 60);
        
        // Simple logic to find best fit unit
        if (hours < 48) {
            setCustomUnit('HOURS');
            setCustomNum(Math.round(hours));
        } else {
            const days = hours / 24;
            if (days > 60) {
                 setCustomUnit('MONTHS');
                 setCustomNum(Math.round(days / 30));
            } else if (days > 13 && days % 7 === 0) {
                 setCustomUnit('WEEKS');
                 setCustomNum(Math.round(days / 7));
            } else {
                 setCustomUnit('DAYS');
                 setCustomNum(Math.round(days));
            }
        }
        setCustomDate(dateStr);
    };

    // Handler wrappers
    const handleNumChange = (val: number) => {
        setCustomNum(val);
        syncToDate(val, customUnit);
    };

    const handleUnitChange = (val: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS') => {
        setCustomUnit(val);
        syncToDate(customNum, val);
    };

    const handleDateChange = (val: string) => {
        syncToDuration(val);
    };
    
    if (!isOpen) return null;

    const isBanning = !user.isBanned;

    const handleConfirm = () => {
        let finalDuration = durationSelection;
        const now = new Date();

        if (durationSelection === 'CUSTOM') {
            if (!customDate) return; 
            const d = new Date(customDate);
            if (isNaN(d.getTime())) return; // Validation before submission
            // Convert local input back to full ISO with timezone for backend
            finalDuration = d.toISOString();
        } else if (durationSelection === '24_HOURS') {
            finalDuration = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        } else if (durationSelection === '7_DAYS') {
            finalDuration = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (durationSelection === '30_DAYS') {
            finalDuration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        
        // 'PERMANENT' is handled by the mock backend to set null.

        onConfirm(reason, finalDuration);
    };

    // Styles
    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const borderColor = isLight ? 'border-slate-200' : 'border-white/10';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-400';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-red-500' : 'bg-black/20 border-white/10 text-white focus:bg-black/40 focus:border-red-500/50';
    const cardBg = isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5';

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border ${borderColor}`} onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-full ${isBanning ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {isBanning ? <Gavel size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/10'}`}>
                            <X size={20}/>
                        </button>
                    </div>

                    <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>
                        {isBanning ? 'Ban User' : 'Unban User'}
                    </h3>
                    <p className={`text-sm mb-6 ${textSecondary}`}>
                        {isBanning 
                            ? `Are you sure you want to ban ${user.displayName}? They will lose access to the platform immediately.`
                            : `Are you sure you want to restore access for ${user.displayName}?`
                        }
                    </p>

                    {isBanning && (
                        <div className="space-y-5 mb-6">
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Ban Duration</label>
                                <div className="relative">
                                    <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                                    <select
                                        value={durationSelection}
                                        onChange={(e) => setDurationSelection(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-1 focus:ring-red-500/50 focus:outline-none text-sm font-medium appearance-none cursor-pointer transition-colors ${inputBg}`}
                                    >
                                        <option value="PERMANENT" className={isLight ? "bg-white" : "bg-[#18181b]"}>Permanent (Forever)</option>
                                        <option value="24_HOURS" className={isLight ? "bg-white" : "bg-[#18181b]"}>24 Hours</option>
                                        <option value="7_DAYS" className={isLight ? "bg-white" : "bg-[#18181b]"}>7 Days</option>
                                        <option value="30_DAYS" className={isLight ? "bg-white" : "bg-[#18181b]"}>30 Days</option>
                                        <option value="CUSTOM" className={isLight ? "bg-white" : "bg-[#18181b]"}>Custom Duration...</option>
                                    </select>
                                </div>
                            </div>

                            {durationSelection === 'CUSTOM' && (
                                <div className={`p-4 rounded-xl border space-y-4 animate-fade-in-up ${cardBg}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSecondary}`}>Duration</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={isNaN(customNum) ? '' : customNum}
                                                    onChange={(e) => handleNumChange(parseInt(e.target.value) || 1)}
                                                    className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-red-500/50 outline-none text-sm font-medium ${inputBg}`}
                                                />
                                                <select
                                                    value={customUnit}
                                                    onChange={(e) => handleUnitChange(e.target.value as any)}
                                                    className={`px-3 py-2 rounded-lg border focus:ring-1 focus:ring-red-500/50 outline-none text-sm font-medium ${inputBg}`}
                                                >
                                                    <option value="HOURS" className={isLight ? "bg-white" : "bg-[#18181b]"}>Hours</option>
                                                    <option value="DAYS" className={isLight ? "bg-white" : "bg-[#18181b]"}>Days</option>
                                                    <option value="WEEKS" className={isLight ? "bg-white" : "bg-[#18181b]"}>Weeks</option>
                                                    <option value="MONTHS" className={isLight ? "bg-white" : "bg-[#18181b]"}>Months</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className={`px-2 rounded-full border ${isLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-[#1e1e21] border-white/5 text-zinc-600'}`}>
                                                <RefreshCw size={12} />
                                            </div>
                                        </div>
                                        <div className={`border-t w-full ${isLight ? 'border-slate-200' : 'border-white/5'}`}></div>
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSecondary}`}>Until Date</label>
                                        <div className="relative">
                                            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                                            <input
                                                type="datetime-local"
                                                value={customDate}
                                                min={getLocalISOString(new Date())}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-1 focus:ring-red-500/50 focus:outline-none text-sm font-medium ${inputBg} ${isLight ? '' : 'color-scheme-dark'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Reason for Ban</label>
                                <textarea
                                    className={`w-full p-3 rounded-xl border focus:ring-1 focus:ring-red-500/50 focus:outline-none text-sm min-h-[100px] resize-none ${inputBg}`}
                                    placeholder="e.g. Violation of Terms of Service, Suspicious Activity..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${isLight ? 'text-slate-500 bg-slate-50 hover:bg-slate-100' : 'text-zinc-400 bg-white/5 hover:bg-white/10'}`}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={isBanning && (!reason.trim() || (durationSelection === 'CUSTOM' && !customDate))}
                            className={`px-5 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isBanning 
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                            }`}
                        >
                            {isBanning ? <Gavel size={16} /> : <AlertTriangle size={16} />}
                            {isBanning ? 'Ban User' : 'Restore Access'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BanUserModal;
