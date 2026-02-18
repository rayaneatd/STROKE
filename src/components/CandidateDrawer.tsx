import React, { useState, useEffect } from 'react';
import {
    X, ExternalLink, Eye, BrainCircuit, MessageSquare, Mail, FileText,
    Trophy, MailCheck, Linkedin, Github, AlertOctagon, Sparkles, ThumbsUp, ThumbsDown,
    HelpCircle, Wand2, Loader2, Edit3, Send, TrendingUp, Briefcase, Clock, Phone, MapPin, GraduationCap
} from 'lucide-react';
import { ProjectFile, User } from '../types';
import { generateAIEmailDraft } from '../services/mockData';

type DrawerTab = 'ANALYSIS' | 'COMMUNICATION' | 'RESUME' | 'INTERVIEW';

interface CandidateDrawerProps {
    isOpen: boolean;
    selectedFile: ProjectFile | null;
    onClose: () => void;
    isLight: boolean;
    accentColor: string;
    isTopCandidate?: boolean;
    onMarkContacted?: (fileId: string) => void;
    onBatchUpdate?: (updates: { id: string, changes: Partial<ProjectFile> }[]) => void;
    currentUser: User;
    textPrimary: string;
    textSecondary: string;
}

const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
    isOpen,
    selectedFile,
    onClose,
    isLight,
    accentColor,
    isTopCandidate,
    onMarkContacted,
    onBatchUpdate,
    currentUser,
    textPrimary,
    textSecondary
}) => {
    const [drawerTab, setDrawerTab] = useState<DrawerTab>('ANALYSIS');
    const [aiPrompt, setAiPrompt] = useState('');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);

    // Reset state when file changes
    useEffect(() => {
        if (selectedFile) {
            const alreadySent = !!selectedFile.emailSentAt;
            setIsEmailSent(alreadySent);
            if (alreadySent) {
                setGeneratedEmail(`[Email sent on ${new Date(selectedFile.emailSentAt!).toLocaleDateString()}]`);
            } else {
                setGeneratedEmail(selectedFile.emailDraft || '');
            }
            setDrawerTab('ANALYSIS');
        }
    }, [selectedFile]);

    const handleGenerateSingleEmail = () => {
        if (!selectedFile) return;
        setIsGeneratingEmail(true);
        setGeneratedEmail('');
        setTimeout(() => {
            const draft = generateAIEmailDraft(selectedFile.candidateName || 'Candidate', selectedFile.score || 0);
            setGeneratedEmail(draft);
            
            // Optimistic update locally? No, rely on parent callback or local state for now
            // But we should update the DB/Parent
            if (onBatchUpdate) {
                onBatchUpdate([{ id: selectedFile.id, changes: { emailDraft: draft } }]);
            }
            
            setIsGeneratingEmail(false);
        }, 1500);
    };

    const handleSendSingleEmail = () => {
        if (onMarkContacted && selectedFile && !isEmailSent) {
            onMarkContacted(selectedFile.id);
            const now = new Date().toISOString();
            
            const update = {
                emailSentAt: now,
                emailSentBy: currentUser.id, // Track who sent it
                emailDraft: undefined
            };

            setIsEmailSent(true);
            setGeneratedEmail(`[Email sent on ${new Date(now).toLocaleDateString()}]`);
            
            if (onBatchUpdate) {
                onBatchUpdate([{ id: selectedFile.id, changes: update }]);
            }
        }
    };

    const handleEmailContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setGeneratedEmail(val);
        if (selectedFile && onBatchUpdate) {
             // Debounce this in real app, but for now direct update is okay or handled by parent debounce
             // Actually, parent might not be updating DB on every keystroke. 
             // We should probably just update local state and save on blur or debounce.
             // For now, let's just update local state and maybe update parent on blur? 
             // To keep it simple and consistent with previous code:
             // The previous code updated onBatchUpdate immediately (which might be heavy).
             // Let's keep it simple: update parent on change if provided.
             onBatchUpdate([{ id: selectedFile.id, changes: { emailDraft: val } }]);
        }
    };

    if (!isOpen || !selectedFile) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
            <div className={`relative w-full max-w-6xl h-full shadow-2xl flex flex-col animate-fade-in-right border-l ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/10'}`}>
                {/* Drawer Header */}
                <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shadow-sm border ${isLight ? `bg-${accentColor}-50 text-${accentColor}-600 border-${accentColor}-100` : `bg-${accentColor}-500/10 text-${accentColor}-400 border-${accentColor}-500/20`}`}>
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-2xl font-bold leading-tight ${textPrimary}`}>{selectedFile.candidateName}</h2>
                                {selectedFile.emailSentAt && (
                                    <div className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                                        <MailCheck size={12} /> Contacted
                                    </div>
                                )}
                                {selectedFile.matchScore !== undefined && selectedFile.matchScore > 0 && (
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${selectedFile.matchScore >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : selectedFile.matchScore >= 50 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`} title={selectedFile.scoreJustification || 'No justification provided'}>
                                        {selectedFile.matchScore}% Match
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <p className={`text-xs flex items-center gap-1.5 ${textSecondary}`}>
                                    <FileText size={12} /> {selectedFile.originalResumeName || selectedFile.name} • Added {new Date(selectedFile.uploadedAt).toLocaleDateString()}
                                </p>
                                {/* Social Links */}
                                {(selectedFile.socialLinks?.linkedin || selectedFile.socialLinks?.github) && (
                                    <div className="flex items-center gap-1">
                                        {selectedFile.socialLinks.linkedin && (
                                            <a href={selectedFile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={`p-1 rounded hover:bg-[#0077b5]/10 text-[#0077b5] transition-colors`} title="LinkedIn Profile">
                                                <Linkedin size={14} />
                                            </a>
                                        )}
                                        {selectedFile.socialLinks.github && (
                                            <a href={selectedFile.socialLinks.github} target="_blank" rel="noopener noreferrer" className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${isLight ? 'text-slate-800' : 'text-white'} transition-colors`} title="GitHub Profile">
                                                <Github size={14} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isTopCandidate && (
                            <div className="px-4 py-1.5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-amber-500 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-500/20 shadow-sm">
                                <Trophy size={14} className="fill-current" /> Top Candidate
                            </div>
                        )}
                        <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Drawer Body - Split View */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left: PDF Visualization */}
                    <div className={`flex-1 p-8 flex flex-col overflow-hidden relative border-r ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050505] border-white/5'}`}>
                        <div className="absolute top-6 right-8 flex gap-2 z-10">
                            <button className={`p-2.5 backdrop-blur rounded-xl shadow-sm border transition-all hover:scale-105 ${isLight ? 'bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border-slate-200' : 'bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border-white/10'}`} title="Open external"><ExternalLink size={18} /></button>
                            <button className={`p-2.5 backdrop-blur rounded-xl shadow-sm border transition-all hover:scale-105 ${isLight ? 'bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border-slate-200' : 'bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border-white/10'}`} title="Quick Preview"><Eye size={18} /></button>
                        </div>
                        <div className={`flex-1 shadow-xl rounded-2xl overflow-y-auto custom-scrollbar p-10 flex flex-col gap-8 items-center border w-full ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/5'}`}>
                            <div className="w-full max-w-3xl space-y-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                                <div className={`h-10 rounded w-1/2 mb-10 ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}></div>
                                <div className="space-y-3">
                                    <div className={`h-4 rounded w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                    <div className={`h-4 rounded w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                    <div className={`h-4 rounded w-3/4 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                </div>
                                <div className={`h-40 rounded-2xl w-full border-2 border-dashed flex items-center justify-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>[Resume Content Preview]</span>
                                </div>
                                <div className="space-y-3 pt-6">
                                    <div className={`h-5 rounded w-1/4 mb-4 ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}></div>
                                    <div className={`h-4 rounded w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                    <div className={`h-4 rounded w-5/6 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Rich AI Drawer */}
                    <div className={`w-full lg:w-[450px] flex flex-col h-full ${isLight ? 'bg-white' : 'bg-[#0e0e10]'}`}>
                        <div className={`flex p-4 border-b gap-2 ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'}`}>
                            <button
                                onClick={() => setDrawerTab('ANALYSIS')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${drawerTab === 'ANALYSIS' ? (isLight ? `bg-slate-100 text-slate-900 shadow-sm border border-slate-200` : 'bg-white/10 text-white shadow-sm border border-white/5') : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                            >
                                <BrainCircuit size={14} /> Analysis
                            </button>
                            <button
                                onClick={() => setDrawerTab('INTERVIEW')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${drawerTab === 'INTERVIEW' ? 'bg-amber-500/10 text-amber-500 shadow-sm border border-amber-500/20' : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                            >
                                <MessageSquare size={14} /> Interview
                            </button>
                            <button
                                onClick={() => setDrawerTab('COMMUNICATION')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${drawerTab === 'COMMUNICATION' ? 'bg-purple-500/10 text-purple-500 shadow-sm border border-purple-500/20' : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                            >
                                <Mail size={14} /> Email
                            </button>
                            <button
                                onClick={() => setDrawerTab('RESUME')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${drawerTab === 'RESUME' ? `bg-${accentColor}-500/10 text-${accentColor}-500 shadow-sm border border-${accentColor}-500/20` : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')}`}
                            >
                                <FileText size={14} /> Profile
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {drawerTab === 'ANALYSIS' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className={`rounded-3xl p-6 border relative overflow-hidden ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#18181b] border-white/5'}`}>
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <h3 className={`text-3xl font-black ${textPrimary}`}>{selectedFile.matchScore ?? selectedFile.score}%</h3>
                                                <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${textSecondary}`}>Match Score</p>
                                            </div>
                                            <div className="w-16 h-16 relative">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className={isLight ? "text-slate-200" : "text-zinc-800"} />
                                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * ((selectedFile.matchScore ?? selectedFile.score) || 0)) / 100} className={`text-${accentColor}-500 transition-all duration-1000 ease-out`} strokeLinecap="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className={`mt-4 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                            {selectedFile.scoreJustification ? (
                                                <p className={`text-xs italic ${textSecondary}`}>{selectedFile.scoreJustification}</p>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md text-[10px] font-bold border border-emerald-500/20">Strong Technical Fit</span>
                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md text-[10px] font-bold border border-blue-500/20">Leadership Potential</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Red Flags Banner */}
                                    {selectedFile.redFlags && selectedFile.redFlags.length > 0 && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 animate-fade-in-up">
                                            <h4 className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase mb-2">
                                                <AlertOctagon size={14} /> Attention Required
                                            </h4>
                                            <ul className={`list-disc list-inside text-xs space-y-1 ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>
                                                {selectedFile.redFlags.map((flag, idx) => (
                                                    <li key={idx}>{flag}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${textSecondary}`}>Executive Summary</h4>
                                        <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                            {selectedFile.executiveSummary || selectedFile.summary || "No summary available for this candidate yet."}
                                        </p>
                                    </div>

                                    {/* Skills Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-xl border col-span-2 md:col-span-1 ${isLight ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                                            <h5 className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-3"><ThumbsUp size={12} /> Key Strengths</h5>
                                            {(selectedFile.keySkills || selectedFile.skills) && (selectedFile.keySkills || selectedFile.skills)!.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {(selectedFile.keySkills || selectedFile.skills)!.slice(0, 8).map((skill, idx) => (
                                                        <span key={idx} className={`text-[10px] px-2 py-1 rounded-full font-bold border ${isLight ? 'bg-white border-emerald-100 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={`text-xs italic ${textSecondary}`}>No specific strengths detected.</p>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-xl border col-span-2 md:col-span-1 ${isLight ? 'bg-rose-50 border-rose-100' : 'bg-rose-500/5 border-rose-500/10'}`}>
                                            <h5 className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-500 uppercase mb-3"><ThumbsDown size={12} /> Missing Skills</h5>
                                            {selectedFile.missingSkills && selectedFile.missingSkills.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedFile.missingSkills.map((skill, idx) => (
                                                        <span key={idx} className={`text-[10px] px-2 py-1 rounded-full font-bold border ${isLight ? 'bg-white border-rose-100 text-rose-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={`text-xs italic ${textSecondary}`}>No critical gaps identified.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Soft Skills */}
                                    {selectedFile.softSkillsAnalysis && (
                                        <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                                            <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 ${textSecondary}`}>
                                                <Sparkles size={12} /> Soft Skills & Personality
                                            </h4>
                                            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                                                {selectedFile.softSkillsAnalysis}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {drawerTab === 'INTERVIEW' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h4 className={`text-xs font-extrabold uppercase tracking-widest ${textSecondary}`}>Suggested Questions</h4>
                                        <span className={`text-[10px] px-2 py-1 rounded border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>AI Generated</span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {selectedFile.interviewQuestions && selectedFile.interviewQuestions.length > 0 ? (
                                            selectedFile.interviewQuestions.map((q: any, idx: number) => (
                                                <div key={idx} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/5'}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isLight ? `bg-${accentColor}-100 text-${accentColor}-600` : `bg-${accentColor}-500/20 text-${accentColor}-400`}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className={`font-medium text-sm ${textPrimary}`}>{q.question || q}</p>
                                                            {q.context && (
                                                                <div className={`text-xs p-3 rounded-lg flex gap-2 ${isLight ? 'bg-slate-50 text-slate-600' : 'bg-white/5 text-zinc-400'}`}>
                                                                    <HelpCircle size={14} className="shrink-0 mt-0.5" />
                                                                    <span>{q.context}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className={`text-center py-10 rounded-2xl border border-dashed ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                                                <MessageSquare className={`mx-auto mb-3 opacity-20 ${textSecondary}`} size={32} />
                                                <p className={`text-sm ${textSecondary}`}>No interview questions generated yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {drawerTab === 'COMMUNICATION' && (
                                <div className="space-y-6 animate-fade-in h-full flex flex-col">
                                    <div className={`bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 transition-opacity ${isEmailSent ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-xs font-bold text-purple-500 uppercase tracking-wider block flex items-center gap-2">
                                                <Sparkles size={14} className="text-purple-500" /> AI Composer
                                            </label>
                                            <button
                                                onClick={handleGenerateSingleEmail}
                                                disabled={isGeneratingEmail || isEmailSent}
                                                className="text-[10px] font-bold bg-purple-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-purple-500 transition-colors disabled:opacity-50"
                                            >
                                                {isGeneratingEmail ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                                Generate Response
                                            </button>
                                        </div>
                                        <textarea
                                            className={`w-full p-3 text-sm rounded-xl border border-white/10 focus:ring-1 focus:ring-purple-500 focus:outline-none min-h-[80px] resize-none disabled:opacity-50 ${isLight ? 'bg-white text-slate-800 placeholder:text-slate-400 border-purple-200' : 'bg-black/20 text-white placeholder:text-zinc-600'}`}
                                            placeholder="Any specific context? e.g. Mention salary range..."
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            disabled={isEmailSent}
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className={`text-xs font-extrabold uppercase tracking-widest ${textSecondary}`}>
                                                Email Draft {isEmailSent && <span className="text-emerald-500 ml-1">(Sent)</span>}
                                            </h4>
                                            <Edit3 size={14} className={textSecondary} />
                                        </div>
                                        <textarea
                                            value={generatedEmail}
                                            onChange={handleEmailContentChange}
                                            disabled={isEmailSent}
                                            className={`flex-1 w-full border rounded-2xl p-6 shadow-sm font-mono text-sm leading-relaxed whitespace-pre-wrap focus:outline-none focus:border-${accentColor}-500 resize-none ${isEmailSent ? (isLight ? 'bg-slate-50 cursor-not-allowed' : 'bg-white/5 cursor-not-allowed') : (isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#18181b] border-white/10 text-zinc-300')}`}
                                            placeholder="Generate a draft or start typing..."
                                        />
                                    </div>

                                    <div className={`flex gap-3 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                        {!isEmailSent && (
                                            <button
                                                onClick={() => {
                                                    setGeneratedEmail('');
                                                    if (onBatchUpdate && selectedFile) {
                                                        onBatchUpdate([{ id: selectedFile.id, changes: { emailDraft: '' } }]);
                                                    }
                                                }}
                                                className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                Clear
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSendSingleEmail}
                                            disabled={!generatedEmail || isEmailSent}
                                            className={`flex-[2] py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 ${isEmailSent
                                                ? 'bg-emerald-600 text-white cursor-default shadow-none'
                                                : isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-zinc-200'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isEmailSent ? <MailCheck size={14} /> : <Send size={14} />}
                                            {isEmailSent ? 'Email Sent' : 'Send Email'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {drawerTab === 'RESUME' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h4 className={`text-xs font-extrabold uppercase tracking-widest mb-4 ${textSecondary}`}>Professional Profile</h4>
                                        
                                        {selectedFile.careerTrajectory && (
                                            <div className="mb-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                                    <TrendingUp size={14} className={`text-${accentColor}-500`} />
                                                    <span className={`text-xs font-bold ${textPrimary}`}>{selectedFile.careerTrajectory}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {selectedFile.currentPosition && (
                                                <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                    <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><Briefcase size={18} /></div>
                                                    <div>
                                                        <span className="block font-bold">{selectedFile.currentPosition}</span>
                                                        <span className={`text-xs ${textSecondary}`}>Current Role</span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {selectedFile.yearsOfExperience !== undefined && (
                                                <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                    <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><Clock size={18} /></div>
                                                    <div>
                                                        <span className="block font-bold">{selectedFile.yearsOfExperience} Years</span>
                                                        <span className={`text-xs ${textSecondary}`}>Experience</span>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedFile.email && (
                                                <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                    <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><Mail size={18} /></div>
                                                    <span className="truncate font-medium">{selectedFile.email}</span>
                                                </div>
                                            )}
                                            {selectedFile.phone && (
                                                <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                    <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><Phone size={18} /></div>
                                                    <span className="font-medium">{selectedFile.phone}</span>
                                                </div>
                                            )}
                                            {selectedFile.location && (
                                                <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                    <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><MapPin size={18} /></div>
                                                    <span className="font-medium">{selectedFile.location}</span>
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-4 text-sm group ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                                <div className={`p-2.5 rounded-xl transition-colors ${isLight ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-100' : 'bg-white/5 text-zinc-500 group-hover:bg-brand-500/10 group-hover:text-brand-400'}`}><GraduationCap size={18} /></div>
                                                <span className="font-medium">Bachelor's Degree</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className={`text-xs font-extrabold uppercase tracking-widest mb-4 ${textSecondary}`}>Extracted Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedFile.keySkills || selectedFile.skills || []).map((skill, idx) => (
                                                <span key={idx} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-default ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-[#18181b] hover:bg-white/5 text-zinc-300 border-white/5'}`}>
                                                    {skill}
                                                </span>
                                            ))}
                                            {(!selectedFile.skills && !selectedFile.keySkills) && (
                                                <span className={`text-xs italic ${textSecondary}`}>No skills extracted yet.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateDrawer;
