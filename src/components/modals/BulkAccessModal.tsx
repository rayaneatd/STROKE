
import React from 'react';
import { Briefcase, Search, BarChart2, User, CheckCircle, X, ShieldCheck } from 'lucide-react';
import { DemoteTarget } from '../../types';
import { useBulkAccessModal } from '../../hooks/useBulkAccessModal';

interface BulkAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onConfirm: (target: DemoteTarget) => void;
}

const BulkAccessModal: React.FC<BulkAccessModalProps> = ({ 
    isOpen, 
    onClose, 
    selectedCount, 
    onConfirm 
}) => {
    const { 
        selectedRole, 
        setSelectedRole, 
        handleConfirm, 
        isLight, 
        accent 
    } = useBulkAccessModal({
        isOpen,
        onClose,
        selectedCount,
        onConfirm
    });

    if (!isOpen) return null;

    const ROLES = [
        { 
            id: 'PARTNER' as DemoteTarget, 
            label: 'Talent Partner', 
            icon: Briefcase, 
            desc: 'Full access to scan resumes, analyze data, and manage candidates.',
            perms: 'Scan & Analyze'
        },
        { 
            id: 'SCOUT' as DemoteTarget, 
            label: 'Talent Scout', 
            icon: Search, 
            desc: 'Focused on sourcing. Can upload and scan resumes but cannot view aggregate analytics.',
            perms: 'Scan Only'
        },
        { 
            id: 'ANALYST' as DemoteTarget, 
            label: 'Talent Analyst', 
            icon: BarChart2, 
            desc: 'View-only access to dashboards and reports. Cannot consume scans.',
            perms: 'Analyze Only'
        },
        { 
            id: 'VISITOR' as DemoteTarget, 
            label: 'Visitor', 
            icon: User, 
            desc: 'Read-only access to project details. Cannot scan or view deep analytics.',
            perms: 'Read Only'
        }
    ];

    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const borderColor = isLight ? 'border-slate-200' : 'border-white/10';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/80'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border ${borderColor}`} onClick={e => e.stopPropagation()}>
                <div className={`p-6 border-b flex justify-between items-center ${borderColor}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isLight ? `bg-${accent}-50 text-${accent}-600` : `bg-${accent}-500/10 text-${accent}-400`}`}>
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${textPrimary}`}>Configure Access</h3>
                            <p className={`text-xs ${textSecondary}`}>Updating permissions for <span className="font-bold">{selectedCount}</span> members</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-zinc-500 hover:bg-white/10 hover:text-white'}`}>
                        <X size={20}/>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ROLES.map((role) => {
                        const isSelected = selectedRole === role.id;
                        const Icon = role.icon;
                        
                        return (
                            <div 
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                                    isSelected 
                                    ? `border-${accent}-500 bg-${accent}-500/5` 
                                    : isLight 
                                        ? 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md' 
                                        : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${isSelected ? `bg-${accent}-500 text-white` : isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-zinc-400'}`}>
                                        <Icon size={20} />
                                    </div>
                                    {isSelected && <CheckCircle size={20} className={`text-${accent}-500`} />}
                                </div>
                                
                                <h4 className={`font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>{role.label}</h4>
                                <p className={`text-xs mb-3 h-8 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{role.desc}</p>
                                
                                <div className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isSelected 
                                    ? `bg-${accent}-500/20 text-${accent}-500` 
                                    : isLight 
                                        ? 'bg-slate-100 text-slate-500' 
                                        : 'bg-white/5 text-zinc-500'
                                }`}>
                                    {role.perms}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={`p-6 border-t flex justify-end gap-3 ${borderColor}`}>
                    <button 
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 bg-${accent}-600 hover:bg-${accent}-500 shadow-${accent}-900/20`}
                    >
                        Update Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkAccessModal;
