
import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, Trash2, Mail, Phone, Check, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ThemedButton from '../ui/ThemedButton';

interface SecuritySettingsProps {
    onChangePassword: (old: string, newP: string, confirmP: string) => void;
    onDeleteAccount: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onChangePassword, onDeleteAccount }) => {
    const { styles, isLight, accent } = useTheme();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Contact Editing State
    const [email, setEmail] = useState('user@company.com'); // Mock initial
    const [phone, setPhone] = useState('');
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onChangePassword(oldPassword, newPassword, confirmPassword);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleUpdateContact = () => {
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setIsEditingContact(false);
            // Mock Toast trigger would go here
            alert("Verification email sent to new address.");
        }, 1500);
    };

    const inputClass = isLight 
        ? 'bg-white border-slate-200 text-slate-800 focus:border-slate-300' 
        : 'bg-black/20 border-white/10 text-white focus:border-white/20';

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Contact Information */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>Contact Information</h2>
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.text.secondary}`}>Primary Email</label>
                            <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${styles.text.tertiary}`} size={16}/>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!isEditingContact}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass} ${!isEditingContact ? 'opacity-70 cursor-default' : ''}`}
                                />
                            </div>
                            {isEditingContact && <p className="text-[10px] text-amber-500 flex items-center gap-1"><AlertTriangle size={10}/> Changing this requires re-verification.</p>}
                        </div>
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.text.secondary}`}>Phone Number</label>
                            <div className="relative">
                                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${styles.text.tertiary}`} size={16}/>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!isEditingContact}
                                    placeholder="+1..."
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-0 transition-all ${inputClass} ${!isEditingContact ? 'opacity-70 cursor-default' : ''}`}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                        {isEditingContact ? (
                            <div className="flex gap-2">
                                <ThemedButton variant="ghost" onClick={() => setIsEditingContact(false)}>Cancel</ThemedButton>
                                <ThemedButton onClick={handleUpdateContact} isLoading={isVerifying} icon={<RefreshCw size={16}/>}>Verify & Update</ThemedButton>
                            </div>
                        ) : (
                            <ThemedButton variant="secondary" onClick={() => setIsEditingContact(true)}>Edit Contact Info</ThemedButton>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Change */}
            <div>
                <h2 className={`text-xl font-bold mb-4 ${styles.text.primary}`}>Access Credentials</h2>
                <div className={`p-6 rounded-2xl border ${styles.bg.surface} ${styles.border.base}`}>
                    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
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
                                Permanently remove your Personal Account and all of its contents from the AIRecruit platform. This action is not reversible, so please continue with caution.
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
