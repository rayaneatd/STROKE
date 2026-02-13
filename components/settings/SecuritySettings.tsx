import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, Trash2, Mail, Check, RefreshCw, X, Loader2, Info, AlertCircle, Briefcase, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import ThemedButton from '../ui/ThemedButton';
import { supabase } from '../../lib/supabase';

interface SecuritySettingsProps {
    currentEmail?: string;
    identities?: {
        id: string;
        provider: string;
        created_at: string;
        last_sign_in_at: string;
        identity_data?: any;
    }[];
    newEmail?: string;
    primaryEmail?: string | null;
    workEmail?: string | null;
    isOwner?: boolean;
    nylasConnected?: boolean;
    onChangePassword: (old: string, newP: string, confirmP: string) => void;
    onDeleteAccount: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ 
    currentEmail, 
    identities = [], 
    newEmail, 
    primaryEmail,
    workEmail,
    isOwner,
    nylasConnected,
    onChangePassword, 
    onDeleteAccount 
}) => {
    const { styles, isLight } = useTheme();
    const queryClient = useQueryClient();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Dual Identity State
    const [primaryEmailInput, setPrimaryEmailInput] = useState(primaryEmail || '');
    const [workEmailInput, setWorkEmailInput] = useState(workEmail || '');
    
    const [isEditingPrimary, setIsEditingPrimary] = useState(false);
    const [isEditingWork, setIsEditingWork] = useState(false);
    
    const [isSavingPrimary, setIsSavingPrimary] = useState(false);
    const [isSavingWork, setIsSavingWork] = useState(false);
    const [isConnectingNylas, setIsConnectingNylas] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Identify Linked Accounts
    const linkedAccounts = identities?.filter(id => id.provider !== 'email') || [];
    const hasLinkedAccounts = linkedAccounts.length > 0;

    const handleSubmitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        onChangePassword(oldPassword, newPassword, confirmPassword);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleUpdateProfileEmail = async (type: 'primary' | 'work') => {
        const emailToUpdate = type === 'primary' ? primaryEmailInput : workEmailInput;
        const setSaving = type === 'primary' ? setIsSavingPrimary : setIsSavingWork;
        const setIsEditing = type === 'primary' ? setIsEditingPrimary : setIsEditingWork;

        setError(null);
        setSuccessMessage(null);
        setSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    [type === 'primary' ? 'primary_email' : 'work_email']: emailToUpdate 
                })
                .eq('id', (await supabase.auth.getUser()).data.user?.id!);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            setSuccessMessage(`${type === 'primary' ? 'Primary' : 'Work'} email updated successfully.`);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Update email error:', err);
            setError(err.message || "Failed to update email");
        } finally {
            setSaving(false);
        }
    };

    const handleConnectNylas = () => {
        setIsConnectingNylas(true);
        // Placeholder for Nylas Integration
        setTimeout(() => {
            setIsConnectingNylas(false);
            alert("Nylas integration coming soon! This will connect to " + workEmail);
        }, 1500);
    };

    const inputClass = isLight 
        ? 'bg-white border-slate-200 text-slate-800 focus:border-slate-300' 
        : 'bg-black/20 border-white/10 text-white focus:border-white/20';

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Linked Accounts Section */}
            {hasLinkedAccounts && (
                <div>
                    <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>Linked Accounts</h2>
                    <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                        <p className={`text-sm mb-4 ${styles.text.secondary}`}>
                            The following third-party accounts are linked to your profile.
                        </p>
                        <div className="space-y-3">
                            {linkedAccounts.map((identity) => (
                                <div key={identity.id} className={`flex items-center justify-between p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isLight ? 'bg-white shadow-sm' : 'bg-black/20'}`}>
                                            <Shield size={20} className={styles.text.primary} />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm capitalize ${styles.text.primary}`}>{identity.provider}</p>
                                            <p className={`text-xs ${styles.text.secondary}`}>Last sign in: {new Date(identity.last_sign_in_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
                                        Active
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Email Identity Section */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>Email Identity</h2>
                
                {/* Global Messages */}
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2 text-sm">
                        <Check size={16} /> {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Email */}
                    <div className={`p-6 rounded-2xl border flex flex-col ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-zinc-400'}`}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold ${styles.text.primary}`}>Primary Email</h3>
                                <p className={`text-xs ${styles.text.secondary}`}>For account recovery & notifications</p>
                            </div>
                        </div>

                        {!primaryEmail && !isOwner && (
                            <div className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 border ${isLight ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                <AlertTriangle size={14} className="shrink-0 mt-0.5"/> 
                                <span>
                                    <strong>Action Required:</strong> Please add a personal primary email to enable project creation and account recovery.
                                </span>
                            </div>
                        )}

                        <div className="flex-1 space-y-3">
                            <input 
                                type="email" 
                                value={primaryEmailInput}
                                onChange={(e) => setPrimaryEmailInput(e.target.value)}
                                disabled={!isEditingPrimary}
                                placeholder="name@gmail.com"
                                className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass} ${!isEditingPrimary ? 'opacity-70 cursor-default' : ''}`}
                            />
                            
                            <div className="flex justify-end pt-2">
                                {isEditingPrimary ? (
                                    <div className="flex gap-2">
                                        <ThemedButton variant="ghost" onClick={() => { setIsEditingPrimary(false); setPrimaryEmailInput(primaryEmail || ''); }}>Cancel</ThemedButton>
                                        <ThemedButton onClick={() => handleUpdateProfileEmail('primary')} isLoading={isSavingPrimary} icon={<Check size={16}/>}>Save</ThemedButton>
                                    </div>
                                ) : (
                                    <ThemedButton variant="secondary" onClick={() => setIsEditingPrimary(true)}>Edit</ThemedButton>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Work Email */}
                    <div className={`p-6 rounded-2xl border flex flex-col ${styles.bg.surface} ${styles.border.base}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold ${styles.text.primary}`}>Work Email</h3>
                                <p className={`text-xs ${styles.text.secondary}`}>For calendar sync & candidate outreach</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <input 
                                type="email" 
                                value={workEmailInput}
                                onChange={(e) => setWorkEmailInput(e.target.value)}
                                disabled={!isEditingWork}
                                placeholder="name@company.com"
                                className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass} ${!isEditingWork ? 'opacity-70 cursor-default' : ''}`}
                            />
                            
                            <div className="flex justify-end pt-2">
                                {isEditingWork ? (
                                    <div className="flex gap-2">
                                        <ThemedButton variant="ghost" onClick={() => { setIsEditingWork(false); setWorkEmailInput(workEmail || ''); }}>Cancel</ThemedButton>
                                        <ThemedButton onClick={() => handleUpdateProfileEmail('work')} isLoading={isSavingWork} icon={<Check size={16}/>}>Save</ThemedButton>
                                    </div>
                                ) : (
                                    <ThemedButton variant="secondary" onClick={() => setIsEditingWork(true)}>Edit</ThemedButton>
                                )}
                            </div>
                        </div>

                        {/* Nylas Integration */}
                        <div className={`mt-6 pt-6 border-t ${styles.border.base}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className={styles.text.tertiary} />
                                    <span className={`text-sm font-bold ${styles.text.secondary}`}>Calendar Sync</span>
                                </div>
                                {nylasConnected ? (
                                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check size={12}/> Connected</span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400">Not Connected</span>
                                )}
                            </div>
                            
                            {workEmail ? (
                                <button
                                    onClick={handleConnectNylas}
                                    disabled={nylasConnected || isConnectingNylas}
                                    className={`w-full py-2.5 rounded-xl border-2 border-dashed font-bold text-sm transition-all flex items-center justify-center gap-2
                                        ${nylasConnected 
                                            ? (isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500')
                                            : (isLight ? 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50' : 'border-white/10 text-zinc-400 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/10')
                                        }`}
                                >
                                    {isConnectingNylas ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    {nylasConnected ? 'Inbox Synced' : 'Connect Inbox'}
                                </button>
                            ) : (
                                <div className={`text-xs text-center italic py-2 ${styles.text.tertiary}`}>
                                    Add a work email to enable calendar sync
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>Access Credentials</h2>
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <form onSubmit={handleSubmitPassword} className="max-w-md space-y-4">
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.text.secondary}`}>Current Password</label>
                            <input 
                                type="password" 
                                value={oldPassword} 
                                onChange={(e) => setOldPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass}`}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${styles.text.secondary}`}>New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass}`}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${styles.text.secondary}`}>Confirm</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass}`}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <ThemedButton type="submit" variant="secondary" icon={<Key size={16}/>}>
                                Update Password
                            </ThemedButton>
                        </div>
                    </form>
                </div>
            </div>

            {/* Danger Zone */}
            <div>
                <h2 className={`text-xl font-bold mb-4 text-red-500`}>Danger Zone</h2>
                <div className={`p-6 rounded-2xl border border-red-500/20 ${isLight ? 'bg-red-50/50' : 'bg-red-500/5'}`}>
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-xl bg-red-500/10 text-red-500`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Delete Account</h3>
                            <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                Permanently remove your Personal Account and all of its contents from the STROKE platform. This action is not reversible, so please continue with caution.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button 
                            onClick={onDeleteAccount}
                            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
