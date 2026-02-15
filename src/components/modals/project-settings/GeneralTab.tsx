
import React from 'react';
import { Type, Sparkles, CheckCircle, Archive, ChevronDown, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface GeneralTabProps {
    formData: Partial<Project>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Project>>>;
    isOwner: boolean;
    canChangeStatus: boolean;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ formData, setFormData, isOwner, canChangeStatus }) => {
    const { t } = useTranslation();
    const { isLight, accent } = useTheme();
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-black/20 border-white/10 text-white focus:bg-black/40';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${textPrimary}`}>
                    <Edit2 size={20} className="text-zinc-400"/> {t('modal.general.title')}
                </h2>
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className={`text-sm font-bold ${textSecondary}`}>{t('modal.general.projectTitle')}</label>
                        <div className="relative group">
                            <Type className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isLight ? 'text-slate-400 group-focus-within:text-brand-500' : 'text-zinc-500 group-focus-within:text-brand-400'}`} size={20} />
                            <input 
                                type="text" 
                                value={formData.title || ''} 
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:border-${accent}-500 focus:ring-1 focus:ring-${accent}-500/50 focus:outline-none transition-all font-semibold ${inputBg}`}
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className={`text-sm font-bold ${textSecondary}`}>{t('modal.general.jobDescription')}</label>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isLight ? 'bg-violet-50 border-violet-100 text-violet-700' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
                                <Sparkles size={12} className="fill-current" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">{t('modal.general.aiContext')}</span>
                            </div>
                        </div>
                        <div className="group relative">
                            <textarea 
                                value={formData.description || ''} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className={`w-full px-4 py-3 rounded-xl border focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all text-sm leading-relaxed min-h-[160px] resize-none ${inputBg}`}
                                required 
                            />
                        </div>
                    </div>

                    {canChangeStatus && (
                        <div className="space-y-2 pt-2">
                            <label className={`text-sm font-bold ${textSecondary}`}>{t('modal.general.status')}</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['ACTIVE', 'COMPLETED', 'ARCHIVED'].map(status => (
                                    <button 
                                        key={status} 
                                        type="button" 
                                        onClick={() => setFormData({...formData, status: status as any})} 
                                        className={`py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                                            formData.status === status 
                                            ? (isLight ? 'bg-slate-800 text-white border-slate-700 shadow-md' : 'bg-zinc-800 text-white border-zinc-700 shadow-md') 
                                            : (isLight ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100' : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10')
                                        }`}
                                    >
                                        {status === 'ACTIVE' && <CheckCircle size={14} />}
                                        {status === 'ARCHIVED' && <Archive size={14} />}
                                        {t(`modal.general.${status.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneralTab;
