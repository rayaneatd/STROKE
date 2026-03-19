
import React from 'react';
import { AlertTriangle, Trash2, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';
import { useTranslation, Trans } from 'react-i18next';

interface SecuritySettingsProps {
    onDownloadData: () => void;
    onDeleteAccount: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
    onDownloadData,
    onDeleteAccount
}) => {
    const { t } = useTranslation();
    const { isLight } = useTheme();

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Download Data */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('settings.security.downloadData.title', 'Export Data')}</h2>
                <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                            <Save size={24} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('settings.security.downloadData.actionTitle', 'Download your personal data')}</h3>
                            <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                {t('settings.security.downloadData.description', 'Get a copy of your preferences, projects, and candidates compiled into a JSON structured file.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={onDownloadData}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                        >
                            <Save size={16} /> {t('settings.security.downloadData.button', 'Request Data')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div>
                <h2 className={`text-xl font-bold mb-4 text-red-500`}>{t('settings.security.dangerZone.title')}</h2>
                <div className={`p-6 rounded-2xl border border-red-500/20 ${isLight ? 'bg-red-50/50' : 'bg-red-500/5'}`}>
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-xl bg-red-500/10 text-red-500`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('settings.security.dangerZone.deleteAccount.title')}</h3>
                            <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                <Trans
                                    i18nKey="settings.security.dangerZone.deleteAccount.description"
                                    components={{ 1: <Logo variant="text" height={14} className="inline-block align-middle mx-1" /> }}
                                />
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={onDeleteAccount}
                            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
                        >
                            <Trash2 size={16} /> {t('settings.security.dangerZone.deleteAccount.button')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
