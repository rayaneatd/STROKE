
import React, { useState, useEffect } from 'react';
import { X, Save, Check, CreditCard, Zap } from 'lucide-react';
import { User, Role, SubscriptionPlan } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (updatedUser: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const { isLight, accent } = useTheme();
    const [formData, setFormData] = useState<User>(user);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(user);
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate network delay
        setTimeout(() => {
            onSave(formData);
            setIsSaving(false);
            onClose();
        }, 600);
    };

    // Styles
    const modalBg = isLight ? 'bg-white' : 'bg-[#18181b]';
    const borderColor = isLight ? 'border-slate-200' : 'border-white/10';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-black/20 border-white/5 text-white focus:bg-black/40';

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-900/30' : 'bg-black/60'}`} onClick={onClose}>
            <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border ${borderColor}`} onClick={e => e.stopPropagation()}>
                <div className={`p-6 border-b flex justify-between items-center ${modalBg} ${borderColor}`}>
                    <div>
                        <h3 className={`text-lg font-bold ${textPrimary}`}>Edit User</h3>
                        <p className={`text-xs ${textSecondary}`}>Update account details for {user.displayName}</p>
                    </div>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}>
                        <X size={20}/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Role Selection */}
                    <div className="space-y-3">
                        <label className={`text-xs font-bold uppercase tracking-wider block ${textSecondary}`}>Access Level</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: Role.USER})}
                                className={`p-3 rounded-xl border text-left transition-all ${formData.role === Role.USER ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/50' : isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-bold ${formData.role === Role.USER ? 'text-blue-500' : isLight ? 'text-slate-700' : 'text-zinc-300'}`}>User</span>
                                    {formData.role === Role.USER && <Check size={14} className="text-blue-500" />}
                                </div>
                                <p className={`text-[10px] ${textSecondary}`}>Standard access to projects.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: Role.ADMIN})}
                                className={`p-3 rounded-xl border text-left transition-all ${formData.role === Role.ADMIN ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/50' : isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-bold ${formData.role === Role.ADMIN ? 'text-purple-500' : isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Admin</span>
                                    {formData.role === Role.ADMIN && <Check size={14} className="text-purple-500" />}
                                </div>
                                <p className={`text-[10px] ${textSecondary}`}>Full system control.</p>
                            </button>
                        </div>
                    </div>

                    {/* Subscription Plan */}
                    <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider block ${textSecondary}`}>Subscription Plan</label>
                        <div className="relative">
                            <CreditCard className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                            <select
                                value={formData.subscriptionPlan}
                                onChange={(e) => setFormData({...formData, subscriptionPlan: e.target.value as SubscriptionPlan})}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-1 focus:ring-brand-500/50 outline-none transition-all cursor-pointer ${inputBg}`}
                            >
                                {Object.values(SubscriptionPlan).map((plan) => (
                                    <option key={plan} value={plan} className={isLight ? "bg-white" : "bg-[#18181b]"}>
                                        {plan.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Scan Credits */}
                    <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider block ${textSecondary}`}>Scan Balance</label>
                        <div className="relative">
                            <Zap className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
                            <input
                                type="number"
                                min="0"
                                value={formData.scansBalance}
                                onChange={(e) => setFormData({...formData, scansBalance: parseInt(e.target.value) || 0})}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-1 focus:ring-brand-500/50 outline-none transition-all ${inputBg}`}
                            />
                        </div>
                        <p className={`text-[10px] ${textSecondary}`}>Manually adjusting credits will not trigger a billing event.</p>
                    </div>

                    <div className={`pt-4 flex justify-end gap-3 border-t ${borderColor}`}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className={`px-6 py-2 text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait ${isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-zinc-200'}`}
                        >
                            {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
