import React, { useState, useEffect } from 'react';
import { 
  X, Edit2, Type, Sparkles, CheckCircle, Archive, ChevronDown, Users, ShieldOff, Save, Loader2 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project, User, ProjectRole, EmployeeAddPermission, DemoteTarget } from '../../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUser: User;
  onSave: (e: React.FormEvent, updatedProject: Partial<Project>) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  currentUser, 
  onSave 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        settings: { ...project.settings }
      });
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const memberRecord = project.members.find(m => m.userId === currentUser.id);
  const userRole = memberRecord?.role || ProjectRole.EMPLOYEE;
  const isOwner = userRole === ProjectRole.OWNER;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network delay for better UX
    setTimeout(() => {
        onSave(e, formData);
        setIsLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl shadow-sm border border-brand-100">
                        <Edit2 size={24} />
                    </div>
                    <div>
                            <h3 className="font-bold text-slate-900 text-xl tracking-tight">{t('modal.editProject.title')}</h3>
                            <p className="text-xs text-slate-500 font-medium">{t('modal.editProject.subtitle')}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <form id="edit-project-form" onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Title */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">{t('modal.editProject.fields.title.label')}</label>
                        <div className="relative group">
                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                            <input 
                            type="text" 
                            value={formData.title || ''} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all font-semibold text-slate-800"
                            placeholder={t('modal.editProject.fields.title.placeholder')}
                            required
                            />
                        </div>
                    </div>
                    
                    {/* Job Description */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700">{t('modal.editProject.fields.description.label')}</label>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-100 rounded-full text-violet-700">
                                <Sparkles size={12} className="text-violet-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">{t('modal.editProject.fields.description.aiContext')}</span>
                            </div>
                        </div>
                        <div className="group relative">
                            <div className={`
                                rounded-2xl border transition-all duration-300 overflow-hidden
                                ${formData.description ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-50 border-slate-200'}
                                focus-within:bg-white focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10
                            `}>
                                <textarea 
                                value={formData.description || ''} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full px-5 py-4 border-none focus:ring-0 h-80 resize-none text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 custom-scrollbar bg-transparent"
                                placeholder={t('modal.editProject.fields.description.placeholder')}
                                required
                                />
                                <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-[11px] font-medium text-slate-400 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                                        <span>{t('modal.editProject.fields.description.aiOptimized')}</span>
                                    </div>
                                    <span>{formData.description?.length || 0} {t('modal.editProject.fields.description.chars')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid for Status & Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Status: Owner Only */}
                        {isOwner && (
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700">{t('modal.editProject.fields.status.label')}</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand-500">
                                    {formData.status === 'ACTIVE' && <CheckCircle size={20}/>}
                                    {formData.status === 'COMPLETED' && <CheckCircle size={20}/>}
                                    {formData.status === 'ARCHIVED' && <Archive size={20}/>}
                                    </div>
                                    <select 
                                    value={formData.status} 
                                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                    className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none appearance-none cursor-pointer font-medium text-slate-700 transition-all"
                                    >
                                        <option value="ACTIVE">{t('modal.editProject.fields.status.options.ACTIVE')}</option>
                                        <option value="COMPLETED">{t('modal.editProject.fields.status.options.COMPLETED')}</option>
                                        <option value="ARCHIVED">{t('modal.editProject.fields.status.options.ARCHIVED')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        )}

                        {/* Settings (Employee Add): Owner Only */}
                        {isOwner && formData.settings && (
                                <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700">{t('modal.editProject.fields.invitationPolicy.label')}</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand-500">
                                        <Users size={20} />
                                    </div>
                                    <select 
                                    value={formData.settings.employeeAddPermission} 
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        settings: { ...formData.settings!, employeeAddPermission: e.target.value as any }
                                    })}
                                    className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none appearance-none cursor-pointer font-medium text-slate-700 transition-all"
                                    >
                                        <option value={EmployeeAddPermission.ALL}>{t('modal.editProject.fields.invitationPolicy.options.ALL')}</option>
                                        <option value={EmployeeAddPermission.OWN_CONNECTIONS}>{t('modal.editProject.fields.invitationPolicy.options.OWN_CONNECTIONS')}</option>
                                        <option value={EmployeeAddPermission.OWNER_CONNECTIONS}>{t('modal.editProject.fields.invitationPolicy.options.OWNER_CONNECTIONS')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                                </div>
                        )}

                        {/* Quick Demote Role: Owner Only */}
                        {isOwner && formData.settings && (
                                <div className="space-y-3 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700">{t('modal.editProject.fields.quickDemote.label')}</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand-500">
                                        <ShieldOff size={20} />
                                    </div>
                                    <select 
                                    value={formData.settings.quickDemoteTarget || 'VISITOR'}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        settings: { ...formData.settings!, quickDemoteTarget: e.target.value as DemoteTarget }
                                    })}
                                    className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none appearance-none cursor-pointer font-medium text-slate-700 transition-all"
                                    >
                                        <option value="PARTNER">{t('modal.editProject.fields.quickDemote.options.PARTNER')}</option>
                                        <option value="SCOUT">{t('modal.editProject.fields.quickDemote.options.SCOUT')}</option>
                                        <option value="ANALYST">{t('modal.editProject.fields.quickDemote.options.ANALYST')}</option>
                                        <option value="VISITOR">{t('modal.editProject.fields.quickDemote.options.VISITOR')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                                </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Sticky Footer */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                    {t('modal.editProject.actions.cancel')}
                </button>
                <button 
                onClick={() => document.getElementById('edit-project-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                disabled={isLoading}
                className="px-8 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                    {t('modal.editProject.actions.save')}
                </button>
            </div>
        </div>
    </div>
  );
};

export default EditProjectModal;