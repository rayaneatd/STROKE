
import React from 'react';
import { Bell, Mail, Smartphone, CalendarClock, Zap } from 'lucide-react';
import { UserPreferences } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface NotificationSettingsProps {
    prefs: UserPreferences;
    onToggle: (key: keyof UserPreferences, subKey?: string) => void;
    onSelectChange: (key: keyof UserPreferences, value: any) => void;
}

const Switch = ({ checked, onChange, accentColor }: { checked: boolean; onChange: () => void; accentColor: string }) => (
    <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${checked ? `bg-${accentColor}-600` : 'bg-zinc-600/50'}`}
    >
        <span
            className={`${
                checked ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm`}
        />
    </button>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ prefs, onToggle, onSelectChange }) => {
    const { styles, accent, isLight } = useTheme();

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>Channels</h2>
                <p className={`text-sm mb-6 ${styles.text.secondary}`}>Choose how you want to receive alerts and updates.</p>
                
                <div className="space-y-4">
                    {/* Email */}
                    <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${styles.bg.card} ${styles.text.secondary}`}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${styles.text.primary}`}>Email Notifications</h3>
                                <p className={`text-xs mt-1 ${styles.text.secondary}`}>Receive weekly digests and critical alerts.</p>
                            </div>
                        </div>
                        <Switch checked={prefs.notifications.email} onChange={() => onToggle('notifications', 'email')} accentColor={accent} />
                    </div>

                    {/* Push */}
                    <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${styles.bg.card} ${styles.text.secondary}`}>
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${styles.text.primary}`}>Push Notifications</h3>
                                <p className={`text-xs mt-1 ${styles.text.secondary}`}>Real-time updates in the browser.</p>
                            </div>
                        </div>
                        <Switch checked={prefs.notifications.push} onChange={() => onToggle('notifications', 'push')} accentColor={accent} />
                    </div>
                </div>
            </div>

            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>Frequency</h2>
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${styles.text.primary}`}>
                        <CalendarClock size={16} /> Digest Schedule
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                        {['DAILY', 'WEEKLY', 'NEVER'].map((freq) => (
                            <button
                                key={freq}
                                onClick={() => onSelectChange('notifications', { ...prefs.notifications, digestFrequency: freq })}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                                    prefs.notifications.digestFrequency === freq 
                                    ? `bg-${accent}-500/10 border-${accent}-500/50 text-${accent}-500 ring-1 ring-${accent}-500/50`
                                    : styles.bg.card + ' ' + styles.border.base + ' hover:border-zinc-500'
                                }`}
                            >
                                <div className={`text-xs font-bold ${prefs.notifications.digestFrequency === freq ? `text-${accent}-500` : styles.text.secondary}`}>
                                    {freq}
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    <div className={`mt-4 flex items-center gap-2 text-[10px] ${styles.text.tertiary}`}>
                        <Zap size={12} className="text-amber-500" />
                        <span>Critical alerts (security, payment) are always sent immediately.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
