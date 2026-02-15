
import React from 'react';
import { Wallet, Calculator, Coins, Lock, Infinity, RefreshCw } from 'lucide-react';
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
                                                disabled={!fundAmount || isProcessingFunds} 
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
                                        <p className="text-[10px] text-zinc-500 mt-2">
                                            {t('modal.billing.transferNote')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Member Quotas */}
                        {userHasPlan && (
                            <div className="space-y-3 pt-4 border-t border-dashed border-white/10">
                                <label className={`text-sm font-bold ${textSecondary}`}>{t('modal.billing.defaultQuota')}</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, settings: { ...prev.settings!, defaultScanQuota: 'UNLIMITED' } }))}
                                        className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                            formData.settings?.defaultScanQuota === 'UNLIMITED'
                                            ? (isLight ? `border-${accent}-500 bg-${accent}-50 text-${accent}-700 shadow-sm` : `border-${accent}-500 bg-${accent}-500/10 text-${accent}-400`)
                                            : (isLight ? 'border-slate-100 bg-white text-slate-500 hover:border-slate-200' : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10')
                                        }`}
                                    >
                                        <Infinity size={20} />
                                        <span className="font-bold text-sm">{t('modal.billing.unlimited')}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (formData.settings?.defaultScanQuota === 'UNLIMITED') {
                                                setFormData(prev => ({ ...prev, settings: { ...prev.settings!, defaultScanQuota: 50 } }));
                                            }
                                        }}
                                        className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                            formData.settings?.defaultScanQuota !== 'UNLIMITED'
                                            ? (isLight ? `border-${accent}-500 bg-${accent}-50 text-${accent}-700 shadow-sm` : `border-${accent}-500 bg-${accent}-500/10 text-${accent}-400`)
                                            : (isLight ? 'border-slate-100 bg-white text-slate-500 hover:border-slate-200' : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10')
                                        }`}
                                    >
                                        <Calculator size={20} />
                                        <span className="font-bold text-sm">{t('modal.billing.customLimit')}</span>
                                    </button>
                                </div>

                                {formData.settings?.defaultScanQuota !== 'UNLIMITED' && (
                                    <div className="relative animate-fade-in">
                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                                            <Calculator size={18} />
                                        </div>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={formData.settings?.defaultScanQuota}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    settings: { ...prev.settings!, defaultScanQuota: isNaN(val) ? 0 : val }
                                                }));
                                            }}
                                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all font-bold ${isLight ? `bg-white border-${accent}-100 focus:border-${accent}-500 focus:ring-${accent}-500/10 text-slate-900` : `bg-black/20 border-white/10 focus:border-${accent}-500 focus:ring-${accent}-500/20 text-white`}`}
                                            placeholder={t('modal.billing.enterQuota')}
                                        />
                                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                                            {t('modal.billing.scans').toUpperCase()}
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-zinc-500 mt-2">
                                    {t('modal.billing.quotaNote')}
                                </p>
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
