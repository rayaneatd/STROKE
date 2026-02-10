
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { login as authLogin, register, MOCK_USERS } from '../services/mockData';
import { Zap, ArrowRight, Loader2, Lock, Mail, User as UserIcon, Eye, EyeOff, RefreshCw, Smartphone, Bug, LayoutGrid, Key, Command } from 'lucide-react';

// Enhanced Compact Social Button
const SocialLoginButton: React.FC<{ 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string;
    subLabel?: string;
    bgColor?: string; 
    textColor?: string; 
    borderColor?: string;
    className?: string;
}> = ({ onClick, icon, label, subLabel, bgColor = 'bg-white', textColor = 'text-slate-900', borderColor = 'border-white/10', className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm group ${bgColor} ${textColor} ${borderColor} ${className}`}
        title={label}
    >
        <div className="shrink-0 transition-transform group-hover:scale-110">{icon}</div>
        <div className="flex flex-col items-start leading-none">
            <span className="truncate">{label}</span>
            {subLabel && <span className="text-[9px] opacity-60 font-medium mt-0.5">{subLabel}</span>}
        </div>
    </button>
);

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  const getPasswordStrength = (pass: string) => {
      let score = 0;
      if (!pass) return 0;
      if (pass.length >= 8) score++;
      if (pass.length >= 12) score++;
      if (/[A-Z]/.test(pass)) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^A-Za-z0-9]/.test(pass)) score++;
      return score;
  };

  const strength = getPasswordStrength(password);

  const handleLoginSuccess = (user: User) => {
      login(user);
      navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      try {
        let user: User;
        if (isRegistering) {
          if (!displayName) throw new Error("Name is required");
          user = register(email, password, displayName, phoneNumber);
        } else {
          user = authLogin(email, password);
        }
        handleLoginSuccess(user);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
        setLoading(false);
      }
    }, 500);
  };

  const handleSocialLogin = (provider: string) => {
      setSocialLoading(provider);
      setTimeout(() => {
          // Mock Social Login - just pick the first user or create one
          const mockUser = MOCK_USERS[0];
          handleLoginSuccess(mockUser);
      }, 1500);
  };

  const handleForgotPassword = () => {
      // Mock forgot password flow
      alert("Reset link sent to your email (Demo Mode).");
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setPassword('');
    setPhoneNumber('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10 animate-fade-in-up">
        {/* Brand Header - Compact */}
        <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_-10px_rgba(14,165,233,0.5)] border border-white/10">
                <Zap className="text-white fill-current" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              {isRegistering ? 'Create Account' : 'Welcome back'}
            </h1>
            <p className="text-zinc-500 text-xs">
              {isRegistering ? 'Start your intelligent recruitment journey' : 'Sign in to manage your workspace'}
            </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e10] border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {(loading || socialLoading) && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center flex-col gap-3">
              <Loader2 className="animate-spin text-brand-500" size={32} />
              <p className="text-sm font-medium text-white">{socialLoading ? `Connecting...` : 'Authenticating...'}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Registration Fields: 2 Columns to save space */}
            {isRegistering && (
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 ml-1 uppercase tracking-wider">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-400 transition-colors" size={16} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 outline-none text-white text-xs transition-all placeholder:text-zinc-600"
                        placeholder="John Doe"
                        required={isRegistering}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 ml-1 uppercase tracking-wider">Phone <span className="text-zinc-600 font-normal normal-case">(Optional)</span></label>
                    <div className="relative group">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-400 transition-colors" size={16} />
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 outline-none text-white text-xs transition-all placeholder:text-zinc-600"
                            placeholder="555-0123"
                        />
                    </div>
                  </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 ml-1 uppercase tracking-wider">
                  {isRegistering ? 'Email' : 'Email or Phone'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-400 transition-colors" size={16} />
                <input
                  type={isRegistering ? "email" : "text"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 outline-none text-white text-xs transition-all placeholder:text-zinc-600"
                  placeholder={isRegistering ? "name@company.com" : "name@company.com or phone"}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                  {isRegistering ? (
                      <button 
                        type="button" 
                        onClick={generatePassword} 
                        className="text-[10px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                      >
                          <RefreshCw size={10} /> Generate
                      </button>
                  ) : (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[10px] font-bold text-zinc-500 hover:text-brand-400 transition-colors"
                      >
                          Forgot?
                      </button>
                  )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-400 transition-colors" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 outline-none text-white text-xs transition-all placeholder:text-zinc-600"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {isRegistering && password && (
                  <div className="pt-1 animate-fade-in">
                      <div className="flex gap-1 h-1 w-full mb-1">
                          {[...Array(5)].map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-full rounded-full flex-1 transition-all duration-500 ${
                                    i < strength 
                                    ? (strength < 3 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-500' : 'bg-emerald-500') 
                                    : 'bg-white/10'
                                }`} 
                              />
                          ))}
                      </div>
                  </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-[10px] font-medium flex items-center gap-2 animate-pulse">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-2 text-sm"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Improved Social Login Section */}
          <div className="mt-6">
              <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-[#0e0e10] px-2 text-zinc-500 font-bold tracking-widest">Or</span>
                  </div>
              </div>

              <div className="space-y-2.5">
                  {/* Google - Primary B2B Choice */}
                  <SocialLoginButton 
                      onClick={() => handleSocialLogin('Google Workspace')}
                      icon={<Mail size={16} className="text-red-500"/>}
                      label="Google Workspace"
                      bgColor="bg-white"
                      textColor="text-slate-900"
                      borderColor="border-slate-200"
                      className="w-full"
                  />
                  
                  {/* Secondary Options Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                      <SocialLoginButton 
                          onClick={() => handleSocialLogin('Microsoft Entra')}
                          icon={<LayoutGrid size={16} className="text-[#00a4ef]"/>} // Microsoft Blue
                          label="Microsoft"
                          bgColor="bg-[#18181b]"
                          textColor="text-white"
                          borderColor="border-white/10 hover:border-white/20"
                      />
                      <SocialLoginButton 
                          onClick={() => handleSocialLogin('SSO')}
                          icon={<Key size={16} className="text-zinc-400"/>}
                          label="SAML SSO"
                          bgColor="bg-[#18181b]"
                          textColor="text-white"
                          borderColor="border-white/10 hover:border-white/20"
                      />
                  </div>
              </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-zinc-500 text-xs">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <button 
                onClick={toggleMode}
                className="ml-2 font-bold text-white hover:text-brand-400 hover:underline transition-colors"
              >
                {isRegistering ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Quick Debug Login - Condensed */}
        {!isRegistering && (
          <div className="mt-4 flex justify-center">
             <div className="inline-flex gap-2 p-1.5 rounded-xl bg-[#0e0e10]/80 border border-white/10 backdrop-blur-sm">
                {MOCK_USERS.slice(0, 2).map(u => (
                    <button 
                        key={u.id}
                        onClick={() => handleLoginSuccess(u)}
                        className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 border border-transparent hover:border-white/5"
                        title={`Login as ${u.role}`}
                    >
                        <Bug size={10} /> {u.role}
                    </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
