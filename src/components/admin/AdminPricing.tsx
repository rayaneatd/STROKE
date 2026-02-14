
import React, { useState, useEffect } from 'react';
import { 
    CreditCard, Zap, Edit2, Save, X, DollarSign, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { getSubscriptionPlans, getScanPackages, updateSubscriptionPlan, updateScanPackage } from '../../services/mockData';
import { PricingPlan, ScanPackageConfig, SubscriptionPlan } from '../../types';

interface AdminPricingProps {
    isLight?: boolean;
}

const AdminPricing: React.FC<AdminPricingProps> = ({ isLight }) => {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [packages, setPackages] = useState<ScanPackageConfig[]>([]);
    
    // Editing State
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setPlans(getSubscriptionPlans());
        setPackages(getScanPackages());
    };

    const handleEditPlan = (plan: PricingPlan) => {
        setEditingPlanId(plan.id);
        setEditForm({ ...plan });
        setMessage(null);
    };

    const handleEditPackage = (pkg: ScanPackageConfig) => {
        setEditingPlanId(pkg.id);
        setEditForm({ ...pkg });
        setMessage(null);
    };

    const handleCancel = () => {
        setEditingPlanId(null);
        setEditForm({});
        setMessage(null);
    };

    const handleSavePlan = () => {
        setIsSaving(true);
        setTimeout(() => {
            updateSubscriptionPlan(editForm.id, editForm);
            setEditingPlanId(null);
            setIsSaving(false);
            setMessage({ type: 'success', text: 'Plan updated successfully' });
            loadData(); // Refresh list
        }, 600);
    };

    const handleSavePackage = () => {
        setIsSaving(true);
        setTimeout(() => {
            updateScanPackage(editForm.id, editForm);
            setEditingPlanId(null);
            setIsSaving(false);
            setMessage({ type: 'success', text: 'Package updated successfully' });
            loadData(); // Refresh list
        }, 600);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'monthlyScans' || name === 'scans' ? Number(value) : value
        }));
    };

    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-[#0e0e10] border-white/5 hover:border-white/10';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const inputClass = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-white/5 border-white/5 text-white';

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Feedback Message */}
            {message && (
                <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-fade-in-up z-50 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {message.type === 'success' ? <Check size={18}/> : <AlertCircle size={18}/>}
                    {message.text}
                </div>
            )}

            {/* --- SECTION 1: SUBSCRIPTION PLANS --- */}
            <div>
                <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
                    <CreditCard size={20} className="text-brand-500" /> Subscription Plans
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className={`rounded-2xl border transition-all ${editingPlanId === plan.id ? `border-brand-500 ring-1 ring-brand-500 shadow-lg ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}` : cardBg}`}>
                            {editingPlanId === plan.id ? (
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Editing {plan.id}</span>
                                        <button onClick={handleCancel} className={`${textSecondary} hover:text-red-500`}><X size={16}/></button>
                                    </div>
                                    
                                    <div>
                                        <label className={`text-xs font-bold block mb-1 ${textSecondary}`}>Display Name</label>
                                        <input 
                                            name="name"
                                            value={editForm.name} 
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-1 focus:ring-brand-500 outline-none ${inputClass}`} 
                                        />
                                    </div>

                                    <div>
                                        <label className={`text-xs font-bold block mb-1 ${textSecondary}`}>Price ($)</label>
                                        <input 
                                            name="price"
                                            type="number"
                                            value={editForm.price} 
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-1 focus:ring-brand-500 outline-none ${inputClass}`} 
                                        />
                                        <p className={`text-[10px] mt-1 ${textSecondary}`}>Set to 0 for "Contact Us"</p>
                                    </div>

                                    <div>
                                        <label className={`text-xs font-bold block mb-1 ${textSecondary}`}>Monthly Scans</label>
                                        <input 
                                            name="monthlyScans"
                                            type="number"
                                            value={editForm.monthlyScans} 
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-1 focus:ring-brand-500 outline-none ${inputClass}`} 
                                        />
                                    </div>

                                    <button 
                                        onClick={handleSavePlan}
                                        disabled={isSaving}
                                        className="w-full py-2 bg-brand-600 text-white rounded-lg font-bold text-xs hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>} Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className={`font-bold text-lg ${textPrimary}`}>{plan.name}</h3>
                                            <p className={`text-xs ${textSecondary}`}>{plan.id}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleEditPlan(plan)}
                                            className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' : 'hover:bg-white/10 text-zinc-500 hover:text-brand-400'}`}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <span className={`text-3xl font-black ${textPrimary}`}>${plan.price}</span>
                                        <span className={`text-xs font-bold ${textSecondary}`}> /mo</span>
                                    </div>

                                    <div className={`mt-auto space-y-2 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                        <div className="flex justify-between text-xs">
                                            <span className={textSecondary}>Scans:</span>
                                            <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{plan.monthlyScans.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className={textSecondary}>Members:</span>
                                            <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{plan.maxMembers}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION 2: SCAN PACKAGES --- */}
            <div>
                <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
                    <Zap size={20} className="text-amber-500 fill-current" /> Scan Top-up Packages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map(pkg => (
                        <div key={pkg.id} className={`rounded-2xl border transition-all ${editingPlanId === pkg.id ? `border-amber-500 ring-1 ring-amber-500/50 shadow-lg ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}` : cardBg}`}>
                            {editingPlanId === pkg.id ? (
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Editing {pkg.id}</span>
                                        <button onClick={handleCancel} className={`${textSecondary} hover:text-red-500`}><X size={16}/></button>
                                    </div>
                                    
                                    <div>
                                        <label className={`text-xs font-bold block mb-1 ${textSecondary}`}>Package Name</label>
                                        <input 
                                            name="name"
                                            value={editForm.name} 
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-1 focus:ring-amber-500 outline-none ${inputClass}`} 
                                        />
                                    </div>

                                    <div>
                                        <label className={`text-xs font-bold block mb-1 ${textSecondary}`}>Price ($)</label>
                                        <input 
                                            name="price"
                                            type="number"
                                            value={editForm.price} 
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-1 focus:ring-amber-500 outline-none ${inputClass}`} 
                                        />
                                    </div>

                                    <div>
                                        <label className={`text-xs font-bold block mb-1 ${textSecondary}`}>Scan Count</label>
                                        <input 
                                            name="scans"
                                            type="number"
                                            value={editForm.scans} 
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-1 focus:ring-amber-500 outline-none ${inputClass}`} 
                                        />
                                    </div>

                                    <button 
                                        onClick={handleSavePackage}
                                        disabled={isSaving}
                                        className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>} Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className={`font-bold text-lg ${textPrimary}`}>{pkg.name}</h3>
                                            <p className={`text-xs ${textSecondary}`}>{pkg.scans} Scans</p>
                                        </div>
                                        <button 
                                            onClick={() => handleEditPackage(pkg)}
                                            className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' : 'hover:bg-white/10 text-zinc-500 hover:text-amber-500'}`}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <span className={`text-3xl font-black ${textPrimary}`}>${pkg.price}</span>
                                    </div>

                                    <div className={`mt-auto text-xs pt-3 border-t ${isLight ? 'border-slate-100 text-slate-400' : 'border-white/5 text-zinc-600'}`}>
                                        ID: {pkg.id}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPricing;
