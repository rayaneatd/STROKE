
import React from 'react';
import { Wallet, ShieldCheck, Check, Zap, Infinity } from 'lucide-react';
import { BillingType } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface BillingSettingsProps {
    billingType: BillingType;
    overageCap: number | 'UNLIMITED';
    onBillingTypeChange: (val: BillingType) => void;
    onOverageCapChange: (val: number | 'UNLIMITED') => void;
    isPaidPlan: boolean;
}

const BillingSettings: React.FC<BillingSettingsProps> = ({ 
    billingType, 
    overageCap, 
    onBillingTypeChange, 
    onOverageCapChange, 
    isPaidPlan 
}) => {
    const { t } = useTranslation();
    const { styles, accent, isLight } = useTheme();

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className={`text-xl font-bold mb-2 ${styles.text.primary}`}>{t('settings.billing.title')}</h2>
                <p className={`text-sm mb-6 ${styles.text.secondary}`}>{t('settings.billing.description')}</p>

                <div className="space-y-4">
                    <button
                        onClick={() => onBillingTypeChange(BillingType.PREPAID)}
                        className={`w-full p-5 rounded-2xl border text-left transition-all relative group ${
                            billingType === BillingType.PREPAID 
                            ? `border-${accent}-500/50 bg-${accent}-500/10 ring-1 ring-${accent}-500/50 shadow-md` 
                            : `${styles.bg.surface} ${styles.border.base} hover:border-opacity-50`
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${billingType === BillingType.PREPAID ? `bg-${accent}-500/20 text-${accent}-500` : styles.bg.card + ' ' + styles.text.secondary}`}>
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <span className={`font-bold block ${styles.text.primary}`}>{t('settings.billing.prudent.title')}</span>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${styles.text.secondary}`}>{t('settings.billing.prudent.badge')}</span>
                                </div>
                            </div>
                            {billingType === BillingType.PREPAID && <Check size={20} className={`text-${accent}-500`}/>}
                        </div>
                        <p className={`text-xs leading-relaxed pl-[3.25rem] ${styles.text.secondary}`}>
                            {t('settings.billing.prudent.description')}
                        </p>
                    </button>

                    <button
                        onClick={() => isPaidPlan && onBillingTypeChange(BillingType.POSTPAID)}
                        disabled={!isPaidPlan}
                        className={`w-full p-5 rounded-2xl border text-left transition-all relative group ${
                            billingType === BillingType.POSTPAID 
                            ? 'border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/50 shadow-md' 
                            : `${styles.bg.surface} ${styles.border.base} hover:border-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${billingType === BillingType.POSTPAID ? 'bg-purple-500/20 text-purple-400' : styles.bg.card + ' ' + styles.text.secondary}`}>
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <span className={`font-bold block ${styles.text.primary}`}>{t('settings.billing.serein.title')}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${styles.text.secondary}`}>{t('settings.billing.serein.badge')}</span>
                                        {!isPaidPlan && <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{t('settings.billing.serein.paidPlanOnly')}</span>}
                                    </div>
                                </div>
                            </div>
                            {billingType === BillingType.POSTPAID && <Check size={20} className="text-purple-500"/>}
                        </div>
                        <p className={`text-xs leading-relaxed pl-[3.25rem] ${styles.text.secondary}`}>
                            {t('settings.billing.serein.description')}
                        </p>
                    </button>

                    {/* Overage Limit Configuration */}
                    {billingType === BillingType.POSTPAID && (
                        <div className="mt-4 ml-2 pl-[3.25rem] pr-2 animate-fade-in">
                            <div className={`rounded-xl border p-4 ${isLight ? 'bg-purple-50 border-purple-100' : 'bg-purple-500/5 border-purple-500/20'}`}>
                                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-3">{t('settings.billing.overage.title')}</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <input 
                                            type="number" 
                                            disabled={overageCap === 'UNLIMITED'}
                                            value={overageCap === 'UNLIMITED' ? '' : overageCap}
                                            onChange={(e) => onOverageCapChange(parseInt(e.target.value) || 0)}
                                            className={`w-full pl-4 pr-4 py-2.5 rounded-lg border focus:border-purple-500 focus:outline-none font-mono disabled:opacity-50 disabled:cursor-not-allowed ${isLight ? 'bg-white text-purple-900 border-purple-200' : 'bg-black/40 text-white border-purple-500/30'}`}
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onOverageCapChange(overageCap === 'UNLIMITED' ? 500 : 'UNLIMITED')}
                                        className={`px-4 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${overageCap === 'UNLIMITED' ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-900/20' : 'bg-transparent text-purple-400 border-purple-500/30 hover:bg-purple-500/10'}`}
                                    >
                                        <Infinity size={16} /> {t('settings.billing.overage.unlimited')}
                                    </button>
                                </div>
                                <p className="text-[10px] text-purple-400/80 mt-2 leading-relaxed">
                                    {overageCap === 'UNLIMITED' 
                                        ? t('settings.billing.overage.unlimitedDesc') 
                                        : t('settings.billing.overage.limitedDesc', { cap: overageCap })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingSettings;
