
import React, { useState, useRef } from 'react';
import { User, AIPreferences, BillingType, SubscriptionPlan } from '../../types';
import { 
    ArrowRight, Check, Rocket, UserPlus, 
    Building2, Server, ChevronRight, BrainCircuit, Target, Sliders, Quote, Camera, Upload, Wallet, CreditCard, ShieldCheck, Zap, Infinity
} from 'lucide-react';
import { updateUser as updateUserMock } from '../../services/mockData';
import { INDUSTRIES } from '../../constants';
import SearchableSelect from '../ui/SearchableSelect';

interface OnboardingWizardProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const STEPS = [
  { id: 0, title: 'Your Persona', icon: <UserPlus size={18}/>, desc: 'Profile Setup' },
  { id: 1, title: 'Workspace', icon: <Building2 size={18}/>, desc: 'Context & Industry' },
  { id: 2, title: 'AI Calibration', icon: <BrainCircuit size={18}/>, desc: 'Configure Engine' },
  { id: 3, title: 'Billing Strategy', icon: <Wallet size={18}/>, desc: 'Safety vs Velocity' }
];

const AVATAR_COLORS = ['0ea5e9', '8b5cf6', 'f59e0b', '10b981', 'ef4444'];

const TONE_EXAMPLES = {
    'PROFESSIONAL': "Candidate possesses strong proficiency in React and Node.js. Their 5 years of experience at a fintech firm aligns well with the Senior Engineer requirements. Recommended for initial screening.",
    'CASUAL': "This candidate looks like a great fit! They've got solid React skills and their background in fintech is exactly what we're looking for. Definitely worth a chat.",
    'DIRECT': "Match Score: 85%. Key Skills: React (High), Node.js (High). Experience: 5 Years. Recommendation: Interview."
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // --- FORM STATE ---
  
  // Step 1: Persona
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarColor, setAvatarColor] = useState('0ea5e9');
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step 2: Workspace
  const [companyName, setCompanyName] = useState(user.company || '');
  const [industry, setIndustry] = useState(user.industry || 'Technology & Software');
  
  // Step 3: AI Config
  const [aiStrictness, setAiStrictness] = useState<'LOW'|'MEDIUM'|'HIGH'>('MEDIUM');
  const [aiTone, setAiTone] = useState<'PROFESSIONAL'|'CASUAL'|'DIRECT'>('PROFESSIONAL');

  // Step 4: Billing
  const [billingType, setBillingType] = useState<BillingType>(BillingType.PREPAID);
  const [overageCap, setOverageCap] = useState<number | 'UNLIMITED'>(user.overageCap || 500);

  // Derived Avatar URL
  const getGeneratedAvatarUrl = (color: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=${color}&color=fff&size=256`;
  
  // Final Avatar Logic
  const currentAvatarUrl = uploadedAvatar || getGeneratedAvatarUrl(avatarColor);

  const isPaidPlan = user.subscriptionPlan !== SubscriptionPlan.FREE;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          setUploadedAvatar(url);
      }
  };

  const handleNext = async () => {
    setIsLoading(true);
    
    // Simulate slight delay for "saving" feel
    await new Promise(resolve => setTimeout(resolve, 500));

    if (currentStep === 0) {
        // Save Profile
        updateUserMock(user.id, { 
            displayName, 
            avatarUrl: currentAvatarUrl 
        });
        setCurrentStep(1);
    } else if (currentStep === 1) {
        // Save Workspace
        updateUserMock(user.id, { 
            company: companyName,
            industry: industry
        });
        setCurrentStep(2);
    } else if (currentStep === 2) {
        // Save AI Preferences
        const aiConfig: AIPreferences = {
            strictness: aiStrictness,
            tone: aiTone,
            emailPersona: 'EMPATHETIC', // Default for new onboarding
            antiGhosting: false,
            rejectionContext: false
        };
        
        // Merge with existing preferences
        const updatedPrefs = {
            ...(user.preferences || {}),
            aiConfig
        };

        updateUserMock(user.id, { 
            preferences: updatedPrefs as any 
        });
        setCurrentStep(3);
    } else if (currentStep === 3) {
        // Save Billing Type
        updateUserMock(user.id, {
            billingType,
            overageCap
        });

        setIsFinished(true);
        
        // Final delay before closing
        setTimeout(() => {
            const finalUser = updateUserMock(user.id, { hasCompletedOnboarding: true });
            onComplete(finalUser);
        }, 2000);
    }
    
    setIsLoading(false);
  };

  const handleSkip = () => {
      if (currentStep < 3) {
          setCurrentStep(currentStep + 1);
      } else {
          // Final step completion
          const finalUser = updateUserMock(user.id, { hasCompletedOnboarding: true });
          onComplete(finalUser);
      }
  };

  if (isFinished) {
      return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
            <div className="text-center text-white animate-fade-in-up">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30 relative">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping"></div>
                    <Check size={48} strokeWidth={4} />
                </div>
                <h2 className="text-4xl font-black mb-3 tracking-tight">Setup Complete!</h2>
                <p className="text-zinc-400 text-lg mb-2">Configuring workspace for <span className="text-white font-bold">{companyName || 'your team'}</span>...</p>
                <div className="w-64 h-1.5 bg-zinc-800 rounded-full mx-auto mt-6 overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[loading_1.5s_ease-in-out_infinite] w-1/2 rounded-full"></div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0e0e10] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
            
            {/* Sidebar / Progress */}
            <div className="bg-[#18181b] border-r border-white/5 w-full md:w-64 p-6 md:p-8 flex flex-col justify-between shrink-0 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-8 md:mb-10">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                            <Rocket size={16} className="fill-current" />
                        </div>
                        <span className="font-bold text-white tracking-tight text-lg">AIRecruit</span>
                    </div>
                    
                    <div className="space-y-1">
                        {STEPS.map((step, idx) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            
                            return (
                                <div key={step.id} className={`group flex items-center gap-4 p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/5 shadow-sm ring-1 ring-white/10' : 'opacity-60'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                                        isActive ? 'bg-brand-500 text-white shadow-md scale-110' : 
                                        isCompleted ? 'bg-emerald-500 text-white' : 
                                        'bg-zinc-800 text-zinc-500'
                                    }`}>
                                        {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id + 1}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                            {step.title}
                                        </div>
                                        {isActive && <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{step.desc}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="relative z-10 hidden md:block">
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <p className="text-xs text-blue-400 font-medium leading-relaxed">
                            "AI-powered recruiting helps teams hire 3x faster."
                        </p>
                    </div>
                </div>

                {/* Decorative BG in sidebar */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative bg-[#0e0e10] min-h-0">
                
                {/* Progress Bar Top */}
                <div className="h-1.5 w-full bg-[#18181b] shrink-0">
                    <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}></div>
                </div>

                <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
                    {currentStep === 0 && (
                        <div className="animate-fade-in space-y-6 md:space-y-8 max-w-lg mx-auto">
                            <div className="text-center">
                                <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Welcome, {displayName.split(' ')[0]}!</h1>
                                <p className="text-zinc-500 text-sm md:text-base">Let's personalize your experience. How should we display your profile?</p>
                            </div>
                            
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-[#18181b] border-2 border-white/10 shadow-xl overflow-hidden relative">
                                        <img 
                                            src={currentAvatarUrl} 
                                            alt="Avatar" 
                                            className="w-full h-full rounded-full object-cover transition-opacity group-hover:opacity-80" 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-sm">
                                            <Camera className="text-white" size={24} />
                                        </div>
                                    </div>
                                    
                                    {!uploadedAvatar && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 p-1 bg-[#18181b] rounded-full shadow-md border border-white/10" onClick={(e) => e.stopPropagation()}>
                                            {AVATAR_COLORS.map(c => (
                                                <button 
                                                    key={c}
                                                    onClick={() => setAvatarColor(c)}
                                                    className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${avatarColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                                                    style={{ backgroundColor: `#${c}` }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {uploadedAvatar && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setUploadedAvatar(null); }}
                                                className="bg-[#18181b] text-xs font-bold text-zinc-400 px-3 py-1 rounded-full shadow-md border border-white/10 hover:bg-white/5 hover:text-white"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs font-bold text-brand-400 cursor-pointer hover:underline flex items-center gap-1"
                                >
                                    <Upload size={12} /> Upload Photo
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-1.5">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={displayName} 
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 focus:bg-black/40 focus:ring-1 focus:ring-brand-500 outline-none transition-all font-medium text-white placeholder:text-zinc-600"
                                        placeholder="e.g. Jane Doe"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="animate-fade-in space-y-6 md:space-y-8 max-w-lg mx-auto">
                            <div className="text-center">
                                <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Set up your Workspace</h1>
                                <p className="text-zinc-500 text-sm md:text-base">Tell us about your organization to calibrate the AI matching engine.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-1.5">Company Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <input 
                                            type="text" 
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 focus:bg-black/40 focus:ring-1 focus:ring-brand-500 outline-none transition-all font-medium text-white placeholder:text-zinc-600"
                                            placeholder="e.g. Acme Corp"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-1.5">Primary Industry</label>
                                    <SearchableSelect 
                                        options={INDUSTRIES}
                                        value={industry}
                                        onChange={setIndustry}
                                        icon={<Server size={18} />}
                                        placeholder="Select Industry..."
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1.5 ml-1">
                                        * The AI uses this to prioritize industry-specific jargon in resumes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-black text-white mb-2">AI Calibration</h1>
                                <p className="text-zinc-500 text-sm md:text-base">Configure how our engine should analyze and rank candidates for your organization.</p>
                            </div>

                            {/* Strictness Settings */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-400 block">Matching Strictness</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setAiStrictness(level as any)}
                                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                                aiStrictness === level 
                                                ? 'border-brand-500/50 bg-brand-500/10 shadow-md ring-1 ring-brand-500/50' 
                                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="relative z-10">
                                                <div className={`text-xs font-black uppercase tracking-widest mb-1 ${aiStrictness === level ? 'text-brand-400' : 'text-zinc-500'}`}>
                                                    {level === 'LOW' ? 'Broad' : level === 'MEDIUM' ? 'Balanced' : 'Precise'}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 leading-tight">
                                                    {level === 'LOW' ? 'Prioritizes potential & transferable skills.' : level === 'MEDIUM' ? 'Standard keyword & semantic matching.' : 'Strict requirement matching only.'}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone Settings */}
                            <div className="space-y-3 pt-2">
                                <label className="text-sm font-bold text-zinc-400 block">AI Summary Tone</label>
                                <div className="flex gap-2">
                                    {['PROFESSIONAL', 'CASUAL', 'DIRECT'].map((tone) => (
                                        <button
                                            key={tone}
                                            onClick={() => setAiTone(tone as any)}
                                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                                                aiTone === tone 
                                                ? 'bg-white text-black border-white shadow-lg' 
                                                : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30 hover:bg-white/5'
                                            }`}
                                        >
                                            {tone.charAt(0) + tone.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Dynamic Example Card */}
                                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 animate-fade-in relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-600"></div>
                                    <div className="flex gap-3">
                                        <Quote size={20} className="text-zinc-600 fill-zinc-600 shrink-0" />
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                                Example Output
                                            </div>
                                            <p className="text-sm text-zinc-300 font-medium italic leading-relaxed">
                                                "{TONE_EXAMPLES[aiTone]}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Billing Logic</h1>
                                <p className="text-zinc-500 text-sm md:text-base">How should we handle usage when your credits run out?</p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setBillingType(BillingType.PREPAID)}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all relative group ${
                                        billingType === BillingType.PREPAID 
                                        ? 'border-brand-500/50 bg-brand-500/10 ring-1 ring-brand-500/50 shadow-md' 
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${billingType === BillingType.PREPAID ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-white block">Prudent Mode</span>
                                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Strict Limits</span>
                                            </div>
                                        </div>
                                        {billingType === BillingType.PREPAID && <Check size={20} className="text-brand-500"/>}
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed pl-[3.25rem]">
                                        Scanning stops immediately when your balance hits zero. You are never charged extra without manual approval. Ideal for strict budgets.
                                    </p>
                                </button>

                                <button
                                    onClick={() => isPaidPlan && setBillingType(BillingType.POSTPAID)}
                                    disabled={!isPaidPlan}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all relative group ${
                                        billingType === BillingType.POSTPAID 
                                        ? 'border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/50 shadow-md' 
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${billingType === BillingType.POSTPAID ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-white block">Serein Mode</span>
                                                {!isPaidPlan && <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 ml-2">PAID PLAN ONLY</span>}
                                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Pay-as-you-go</span>
                                            </div>
                                        </div>
                                        {billingType === BillingType.POSTPAID && <Check size={20} className="text-purple-500"/>}
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed pl-[3.25rem]">
                                        Work continues seamlessly. Negative balance (overage) is tracked via Polar.sh and billed automatically at the end of the cycle.
                                    </p>
                                </button>

                                {/* Overage Limit Configuration */}
                                {billingType === BillingType.POSTPAID && (
                                    <div className="mt-4 ml-2 pl-[3.25rem] pr-2 animate-fade-in">
                                        <div className="bg-purple-500/5 rounded-xl border border-purple-500/20 p-4">
                                            <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-3">Credit Limit (Safety Cap)</label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 relative">
                                                    <input 
                                                        type="number" 
                                                        disabled={overageCap === 'UNLIMITED'}
                                                        value={overageCap === 'UNLIMITED' ? '' : overageCap}
                                                        onChange={(e) => setOverageCap(parseInt(e.target.value) || 0)}
                                                        className="w-full pl-4 pr-4 py-2.5 rounded-lg bg-black/40 border border-purple-500/30 focus:border-purple-500 focus:outline-none text-white font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                                        placeholder="Unlimited"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setOverageCap(overageCap === 'UNLIMITED' ? 500 : 'UNLIMITED')}
                                                    className={`px-4 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${overageCap === 'UNLIMITED' ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-900/20' : 'bg-transparent text-purple-400 border-purple-500/30 hover:bg-purple-500/10'}`}
                                                >
                                                    <Infinity size={16} /> Unlimited
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-purple-300/60 mt-2 leading-relaxed">
                                                {overageCap === 'UNLIMITED' 
                                                    ? "You will be billed for all usage at the end of the billing cycle without interruption." 
                                                    : `Scanning will automatically stop if your balance reaches -${overageCap} scans.`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 md:px-10 border-t border-white/5 bg-[#0e0e10] mt-auto flex justify-between items-center shrink-0">
                    <button 
                        onClick={handleSkip}
                        className="text-zinc-500 hover:text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Skip
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={isLoading}
                        className="bg-white text-black px-6 md:px-8 py-3 rounded-xl font-bold shadow-xl shadow-white/10 hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group text-sm md:text-base"
                    >
                        {isLoading ? 'Processing...' : currentStep === 3 ? 'Finish Setup' : 'Continue'} 
                        {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OnboardingWizard;
