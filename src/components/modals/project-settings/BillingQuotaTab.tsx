
import React from 'react';
import { Wallet, Calculator, Coins, Lock, Infinity, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project, User, ProjectBillingMode } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface BillingQuotaTabProps {
    formData: Partial<Project>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Project>>>;
    currentUser: User;
    // Edit Mode Props
    onFundAction?: (action: 'DEPOSIT' | 'WITHDRAW') => void;
    isProcessingFunds?: boolean;
    fundMessage?: {type: 'success'|'error', text: string} | null;
    fundAmount?: number | '';
    setFundAmount?: (val: number | '') => void;
    // Generic Props
    canAccessInvestment: boolean;
    userHasPlan: boolean;
    mode: 'CREATE' | 'EDIT';
}

const BillingQuotaTab: React.FC<BillingQuotaTabProps> = ({ 
    formData, 
    setFormData, 
    currentUser, 
    onFundAction,
    isProcessingFunds,
    fundMessage,
    fundAmount,
    setFundAmount,
    canAccessInvestment,
    userHasPlan,
    mode
}) => {
    const { t } = useTranslation();
    const { isLight, accent } = useTheme();
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-black/20 border-white/10 text-white focus:bg-black/40';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';

    const handleBillingModeChange = (mode: ProjectBillingMode) => {
        setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings!, billingMode: mode }
        }));
    };

    const renderQuotaInput = (
        label: string, 
        value: number | 'UNLIMITED' | undefined, 
        onChange: (val: number | 'UNLIMITED') => void
    ) => {
        const isUnlimited = value === 'UNLIMITED' || value === undefined;
        // If undefined, treat as UNLIMITED for display, but actual value might be undefined in state until changed
        const numericValue = typeof value === 'number' ? value : 50;

        return (
            <div className="space-y-2">
                <label className={`text-xs font-bold ${textSecondary}`}>{label}</label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onChange('UNLIMITED')}
                        className={`p-2 rounded-lg border flex-1 flex items-center justify-center gap-2 transition-all ${
                            isUnlimited
                            ? (isLight ? `border-${accent}-500 bg-${accent}-50 text-${accent}-700 shadow-sm` : `border-${accent}-500 bg-${accent}-500/10 text-${accent}-400`)
                            : (isLight ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300' : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10')
                        }`}
                    >
                        <Infinity size={16} />
                        <span className="text-xs font-bold">{t('modal.billing.unlimited')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (isUnlimited) onChange(50);
                        }}
                        className={`p-2 rounded-lg border flex-1 flex items-center justify-center gap-2 transition-all ${
                            !isUnlimited
                            ? (isLight ? `border-${accent}-500 bg-${accent}-50 text-${accent}-700 shadow-sm` : `border-${accent}-500 bg-${accent}-500/10 text-${accent}-400`)
                            : (isLight ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300' : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10')
                        }`}
                    >
                        <Calculator size={16} />
                        <span className="text-xs font-bold">{t('modal.billing.customLimit')}</span>
                    </button>
                </div>
                {!isUnlimited && (
                    <div className="relative animate-fade-in">
                        <input 
                            type="number" 
                            min="1"
                            value={numericValue}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                onChange(isNaN(val) ? 0 : val);
                            }}
                            className={`w-full px-3 py-2 pl-3 pr-12 rounded-lg border focus:ring-2 focus:outline-none transition-all font-bold text-sm ${isLight ? `bg-white border-${accent}-100 focus:border-${accent}-500 focus:ring-${accent}-500/10 text-slate-900` : `bg-black/20 border-white/10 focus:border-${accent}-500 focus:ring-${accent}-500/20 text-white`}`}
                        />
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                            {t('modal.billing.scans').toUpperCase()}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${textPrimary}`}>
                    <Wallet size={20} className="text-zinc-400"/> {t('modal.billing.title')}
                </h2>
                
                {canAccessInvestment ? (
                    <div className="space-y-8">
                        {/* Billing Mode Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleBillingModeChange('OWNER_WALLET')}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    formData.settings?.billingMode === 'OWNER_WALLET'
                                    ? (isLight ? `bg-${accent}-50 border-${accent}-500 ring-1 ring-${accent}-500 shadow-md` : `bg-${accent}-500/10 border-${accent}-500 ring-1 ring-${accent}-500/50`)
                                    : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-white/5 border-white/5 hover:bg-white/10')
                                }`}
                            >
                                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                                    <Wallet size={16}/> {t('modal.billing.sharedWallet')}
                                </div>
                                <p className={`text-xs ${textSecondary}`}>{t('modal.billing.sharedWalletDesc')}</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleBillingModeChange('PROJECT_INVESTMENT')}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    formData.settings?.billingMode === 'PROJECT_INVESTMENT'
                                    ? (isLight ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 shadow-md' : 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50')
                                    : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-white/5 border-white/5 hover:bg-white/10')
                                }`}
                            >
                                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                                    <Coins size={16}/> {t('modal.billing.dedicatedBudget')}
                                </div>
                                <p className={`text-xs ${textSecondary}`}>{t('modal.billing.dedicatedBudgetDesc')}</p>
                            </button>
                        </div>

                        {/* Project Investment Controls */}
                        {formData.settings?.billingMode === 'PROJECT_INVESTMENT' && (
                            <div className={`border border-amber-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden ${isLight ? 'bg-amber-50' : 'bg-[#18181b]'}`}>
                                {mode === 'EDIT' ? (
                                    <>
                                        <div className="flex justify-between items-end mb-6 relative z-10">
                                            <div>
                                                <h4 className="font-bold text-amber-500 text-sm uppercase tracking-wider mb-1">{t('modal.billing.projectBudget')}</h4>
                                                <div className={`text-3xl font-black ${textPrimary}`}>
                                                    {formData.investmentBalance || 0} <span className="text-sm font-medium text-zinc-500">{t('modal.billing.scans')}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-zinc-500 mb-1">{t('modal.billing.walletBalance')}</div>
                                                <div className={`font-bold ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>{currentUser.scansBalance}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-center relative z-10">
                                            <input 
                                                type="number" 
                                                placeholder={t('modal.billing.amount')} 
                                                value={fundAmount} 
                                                onChange={(e) => setFundAmount && setFundAmount(parseInt(e.target.value) || '')} 
                                                className={`flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-bold ${inputBg} ${isLight ? 'border-amber-200' : 'border-white/10'}`} 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => onFundAction && onFundAction('DEPOSIT')} 
                                                disabled={!fundAmount || isProcessingFunds || (typeof fundAmount === 'number' && fundAmount > currentUser.scansBalance)} 
                                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {isProcessingFunds ? <RefreshCw className="animate-spin" size={14}/> : t('modal.billing.deposit')}
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => onFundAction && onFundAction('WITHDRAW')} 
                                                disabled={!fundAmount || isProcessingFunds || (fundAmount > (formData.investmentBalance || 0))} 
                                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 border ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'}`}
                                            >
                                                {t('modal.billing.withdraw')}
                                            </button>
                                        </div>
                                        {fundMessage && <div className={`mt-3 text-xs font-bold ${fundMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{fundMessage.text}</div>}
                                        {typeof fundAmount === 'number' && fundAmount > currentUser.scansBalance && (
                                            <div className="mt-2 text-xs font-bold text-red-400 flex items-center gap-1">
                                                <AlertTriangle size={12} /> {t('common.error')}: {t('project.errors.insufficientFunds', 'Insufficient funds in your wallet')}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // CREATE MODE
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-sm font-bold text-amber-500 uppercase tracking-wider">{t('modal.billing.initialBudget')}</label>
                                            <span className="text-xs font-medium text-zinc-500">{t('modal.billing.yourWallet', { balance: currentUser.scansBalance })}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <input 
                                                type="number" 
                                                placeholder={t('modal.billing.enterAmount')} 
                                                value={formData.investmentBalance || ''} 
                                                onChange={(e) => setFormData({...formData, investmentBalance: parseInt(e.target.value) || 0})}
                                                className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-bold ${inputBg} ${isLight ? 'border-amber-200' : 'border-white/10'}`} 
                                                autoFocus
                                            />
                                        </div>
                                        {(formData.investmentBalance || 0) > currentUser.scansBalance && (
                                            <div className="mt-2 text-xs font-bold text-red-400 flex items-center gap-1">
                                                <AlertTriangle size={12} /> {t('common.error')}: {t('project.errors.insufficientFunds', 'Insufficient funds in your wallet')}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-zinc-500 mt-2">
                                            {t('modal.billing.transferNote')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Member Quotas */}
                        {userHasPlan && (
                            <div className="space-y-6 pt-6 border-t border-dashed border-white/10">
                                {/* Default Quota Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className={`font-bold text-sm ${textPrimary}`}>{t('modal.billing.defaultQuota')}</h3>
                                    </div>
                                    <p className={`text-xs mb-4 ${textSecondary}`}>{t('modal.billing.quotaNote')}</p>
                                    
                                    <div className="max-w-md">
                                        {renderQuotaInput(
                                            t('modal.billing.defaultQuota'), 
                                            formData.settings?.defaultScanQuota, 
                                            (val) => setFormData(prev => ({ ...prev, settings: { ...prev.settings!, defaultScanQuota: val } }))
                                        )}
                                    </div>
                                </div>

                                {/* Role-based Quotas Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className={`font-bold text-sm ${textPrimary}`}>{t('modal.billing.roleQuotas')}</h3>
                                    </div>
                                    <p className={`text-xs mb-4 ${textSecondary}`}>{t('modal.billing.roleQuotasDesc')}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {renderQuotaInput(
                                            t('modal.billing.adminQuota'), 
                                            formData.settings?.adminScanQuota ?? 'UNLIMITED', 
                                            (val) => setFormData(prev => ({ ...prev, settings: { ...prev.settings!, adminScanQuota: val } }))
                                        )}
                                        {renderQuotaInput(
                                            t('modal.billing.partnerQuota'), 
                                            formData.settings?.partnerScanQuota ?? 'UNLIMITED', 
                                            (val) => setFormData(prev => ({ ...prev, settings: { ...prev.settings!, partnerScanQuota: val } }))
                                        )}
                                        {renderQuotaInput(
                                            t('modal.billing.scoutQuota'), 
                                            formData.settings?.scoutScanQuota ?? 'UNLIMITED', 
                                            (val) => setFormData(prev => ({ ...prev, settings: { ...prev.settings!, scoutScanQuota: val } }))
                                        )}
                                        {renderQuotaInput(
                                            t('modal.billing.analystQuota'), 
                                            formData.settings?.analystScanQuota ?? 'UNLIMITED', 
                                            (val) => setFormData(prev => ({ ...prev, settings: { ...prev.settings!, analystScanQuota: val } }))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`p-6 rounded-2xl text-center border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-500 ${isLight ? 'bg-white' : 'bg-white/5'}`}><Lock size={20} /></div>
                        <h4 className={`font-bold text-sm ${textPrimary}`}>{t('modal.billing.lockedTitle')}</h4>
                        <p className={`text-xs mt-1 mb-4 max-w-xs mx-auto ${textSecondary}`}>{t('modal.billing.lockedDesc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingQuotaTab;
