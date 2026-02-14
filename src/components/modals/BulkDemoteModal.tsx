
import React, { useState } from 'react';
import { Briefcase, Search, BarChart2, User, CheckCircle, X, ShieldOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { DemoteTarget } from '../../types';

interface BulkDemoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onConfirm: (target: DemoteTarget) => void;
}

const BulkDemoteModal: React.FC<BulkDemoteModalProps> = ({ 
    isOpen, 
    onClose, 
    selectedCount, 
    onConfirm 
}) => {
    const { isLight, accent } = useTheme();
    const [selectedRole, setSelectedRole] = useState<DemoteTarget>('PARTNER');

    if (!isOpen) return null;

    const ROLES: { id: DemoteTarget; label: string; icon: any; desc: string; perms: string }[] = [
        { 
            id: 'PARTNER', 
            label: 'Talent Partner', 
            icon: Briefcase, 
            desc: 'Retains full scanning and analytics capabilities, but loses administrative controls.',
            perms: 'Scan & Analyze'
        },
        { 
            id: 'SCOUT', 
            label: 'Talent Scout', 
            icon: Search, 
            desc: 'Can upload and scan resumes. No access to project analytics or settings.',
            perms: 'Scan Only'
        },
        { 
            id: 'ANALYST', 
            label: 'Talent Analyst', 
            icon: BarChart2, 
            desc: 'View-only access to data. Cannot perform scans or manage settings.',
            perms: 'Analyze Only'
        },
        { 
            id: 'VISITOR', 
            label: 'Visitor', 
            icon: User, 
            desc: 'Strictly read-only access to project details.',
            perms: 'Read Only'
        }
    ];

    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const borderColor = isLight ? 'border-slate-200' : 'border-white/10';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-400';

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/80'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border ${borderColor}`} onClick={e => e.stopPropagation()}>
                <div className={`p-6 border-b flex justify-between items-center ${borderColor}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isLight ? 'bg-orange-50 text-orange-600' : 'bg-orange-500/10 text-orange-400'}`}>
                            <ShieldOff size={24} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${textPrimary}`}>Demote Admins</h3>
                            <p className={`text-xs ${textSecondary}`}>Select new role for <span className="font-bold">{selectedCount}</span> members</p>
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
                                <h4 className={`font-bold text-sm mb-1 ${textPrimary}`}>{role.label}</h4>
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isSelected ? `text-${accent}-600` : textSecondary}`}>
                                    {role.perms}
                                </div>
                                <p className={`text-xs leading-relaxed ${textSecondary}`}>
                                    {role.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className={`p-6 border-t flex justify-end gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/5'}`}>
                    <button 
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-200' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm(selectedRole)}
                        className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all transform active:scale-95 bg-orange-600 hover:bg-orange-500 shadow-orange-500/20`}
                    >
                        Demote {selectedCount} Members
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkDemoteModal;
