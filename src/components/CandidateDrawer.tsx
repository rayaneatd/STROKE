import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Mail,
  Phone,
  Linkedin,
  Github,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mic,
  FileText,
  Rocket,
  ExternalLink,
  Loader2,
  Copy,
  LayoutDashboard,
  MessageSquare,
  Star,
  ThumbsDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { debounce } from '../utils/performance';

interface CandidateDrawerData {
  candidate_name: string | null;
  current_position: string | null;
  years_of_experience: number | string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  social_links: {
    linkedin?: string;
    github?: string;
  } | null;
  match_score: number | null;
  score_justification: string | null;
  career_trajectory: string | null;
  executive_summary: string | null;
  summary: string | null;
  soft_skills_analysis: string | null;
  key_skills: unknown;
  missing_skills: unknown;
  red_flags: unknown;
  interview_questions: unknown;
  email_draft: string | null;
  email_sent_at: string | null;
  original_resume_name: string | null;
  uploaded_at: string | null;
}

interface CandidateDrawerProps {
  isOpen: boolean;
  candidateId: string | null;
  onClose: () => void;
  hideCommunicationTab?: boolean;
  status?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, current: boolean) => Promise<void>;
  onUpdateStatus?: (id: string, status: string) => Promise<void>;
}

type DrawerTab = 'analysis' | 'communication' | 'interview';

const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  isOpen,
  candidateId,
  onClose,
  hideCommunicationTab = false,
  status,
  isFavorite,
  onToggleFavorite,
  onUpdateStatus
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<CandidateDrawerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>('analysis');
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // --- Interview Questions State ---
  const [newQuestion, setNewQuestion] = useState('');
  const [newContext, setNewContext] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isUpdatingQuestions, setIsUpdatingQuestions] = useState(false);

  // --- Autosave Logic ---

  const saveDraft = useCallback(
    async (currentDraft: string) => {
      if (!candidateId) return;
      setSaveStatus('saving');
      try {
        const { error } = await supabase.rpc('save_candidate_email_draft', {
          p_candidate_id: candidateId,
          p_draft: currentDraft
        });
        if (error) {
          console.error('Autosave failed:', error);
          setSaveStatus('error');
        } else {
          setSaveStatus('saved');
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    },
    [candidateId]
  );

  // Debounced save function
  const debouncedSave = useMemo(
    () => debounce((val: string) => saveDraft(val), 1000),
    [saveDraft]
  );

  // Handle draft changes
  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDraft(val);
    debouncedSave(val);
  };

  // Save on close
  useEffect(() => {
    return () => {
      if (candidateId && draft) {
        saveDraft(draft);
      }
    };
  }, [candidateId, draft, saveDraft]);

  // --- Sending Logic ---

  const handleSendEmail = async () => {
    if (!candidateId || !draft.trim()) return;

    setIsSending(true);
    try {
      // 1. Simulate sending (replace with real API later)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Log for debug
      console.log('draft envoyé');
      console.log(`[Debug] To: ${data?.email || 'N/A'} | Content: ${draft.substring(0, 50)}...`);

      // 3. Update DB state
      const now = new Date().toISOString();
      const { error } = await supabase.rpc('save_candidate_email_draft', {
        p_candidate_id: candidateId,
        p_draft: draft,
        p_sent_at: now
      });

      if (error) throw error;

      // 4. Update local state
      setData(prev => prev ? { ...prev, email_sent_at: now } : null);

    } catch (err) {
      console.error('Failed to send email:', err);
      // Could add toast here
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!candidateId || !isOpen) return;
      setLoading(true);
      setError(null);
      setData(null);
      setActiveTab('analysis');
      try {
        const { data, error } = (await supabase.rpc('get_candidate_drawer_data' as any, {
          p_candidate_id: candidateId
        })) as { data: CandidateDrawerData[] | CandidateDrawerData | null; error: any };
        if (error) throw error;
        const candidateData = Array.isArray(data) ? data[0] : data;
        if (!candidateData) {
          throw new Error(t('candidateDrawer.error.notFound'));
        }
        setData(candidateData);
        setDraft(candidateData.email_draft || '');
      } catch (err: any) {
        console.error('Error fetching candidate data:', err);
        setError(err.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [candidateId, isOpen, t]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
    document.body.style.overflow = 'unset';
  }, [isOpen]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]';
  };

  const copyToClipboard = (text?: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  };

  const toStringArray = (value: unknown) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
    if (typeof value === 'string') return [value];
    if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map((item) => String(item));
    return [];
  };

  const toQuestions = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const q = item as { question?: string; context?: string };
        if (!q.question) return null;
        return { question: String(q.question), context: q.context ? String(q.context) : undefined };
      })
      .filter(Boolean) as { question: string; context?: string }[];
  };

  const yearsDisplay = useMemo(() => {
    if (!data?.years_of_experience && data?.years_of_experience !== 0) return t('common.unknown');
    const parsed = Number(data.years_of_experience);
    if (Number.isNaN(parsed)) return t('common.unknown');
    return String(parsed);
  }, [data?.years_of_experience, t]);

  const normalized = useMemo(() => {
    return {
      keySkills: toStringArray(data?.key_skills),
      missingSkills: toStringArray(data?.missing_skills),
      redFlags: toStringArray(data?.red_flags),
      questions: toQuestions(data?.interview_questions)
    };
  }, [data?.key_skills, data?.missing_skills, data?.red_flags, data?.interview_questions]);

  if (!isOpen) return null;

  const matchScoreValue = typeof data?.match_score === 'number' ? data.match_score : null;
  const linkedinUrl = data?.social_links?.linkedin;
  const githubUrl = data?.social_links?.github;

  // --- Interview Questions Logic ---

  const handleAddQuestion = async () => {
    if (!candidateId || !newQuestion.trim()) return;

    setIsUpdatingQuestions(true);
    try {
      const currentQuestions = normalized.questions;
      const updatedQuestions = [
        ...currentQuestions,
        { question: newQuestion.trim(), context: newContext.trim() || undefined }
      ];

      const { error } = await supabase.rpc('update_candidate_interview_questions', {
        p_candidate_id: candidateId,
        p_questions: updatedQuestions
      });

      if (error) throw error;

      setData(prev => prev ? { ...prev, interview_questions: updatedQuestions } : null);
      setNewQuestion('');
      setNewContext('');
      // setIsAddingQuestion(false); // Keep open for rapid entry
    } catch (err) {
      console.error('Failed to add question:', err);
    } finally {
      setIsUpdatingQuestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (!candidateId) return;

    // Optimistic update
    const currentQuestions = normalized.questions;
    const updatedQuestions = currentQuestions.filter((_, i) => i !== index);

    // Save previous state for rollback
    const previousData = data;

    // Update local state immediately
    setData(prev => prev ? { ...prev, interview_questions: updatedQuestions } : null);

    try {
      const { error } = await supabase.rpc('update_candidate_interview_questions', {
        p_candidate_id: candidateId,
        p_questions: updatedQuestions
      });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to delete question:', err);
      // Rollback on error
      setData(previousData);
    }
  };

  const renderAnalysis = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/5 shadow-sm">
        {data?.career_trajectory && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Rocket className="w-3.5 h-3.5" />
            {data.career_trajectory}
          </div>
        )}
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
          {t('candidateDrawer.analysis.executiveSummary')}
        </h3>
        <p className="text-zinc-200 leading-relaxed text-sm">
          {data?.executive_summary || data?.summary || t('candidateDrawer.analysis.noSummary')}
        </p>
      </div>

      {normalized.redFlags.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/10 border border-rose-500/20 shadow-sm">
          <h3 className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider mb-4">
            <AlertTriangle className="w-4 h-4" />
            {t('candidateDrawer.analysis.attention')}
          </h3>
          <ul className="space-y-2">
            {normalized.redFlags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-rose-200/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            {t('candidateDrawer.analysis.keyStrengths')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {normalized.keySkills.length > 0 ? (
              normalized.keySkills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-medium shadow-sm">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-zinc-500 text-xs italic">{t('candidateDrawer.analysis.noStrengths')}</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <XCircle className="w-4 h-4" />
            {t('candidateDrawer.analysis.missingSkills')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {normalized.missingSkills.length > 0 ? (
              normalized.missingSkills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 text-xs font-medium decoration-zinc-700">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-zinc-500 text-xs italic">{t('candidateDrawer.analysis.noGaps')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('candidateDrawer.analysis.softSkills')}</h3>
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5">
          <p className="text-zinc-300 text-sm leading-relaxed">
            {data?.soft_skills_analysis || t('candidateDrawer.analysis.noJustification')}
          </p>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => {
    const isEmailSent = !!data?.email_sent_at;

    return (
      <div className="space-y-6 h-full flex flex-col animate-fade-in">
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-500" />
              {t('candidateDrawer.email.draftTitle')}
            </h3>
            {data?.email_sent_at && (
              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                {t('candidateDrawer.email.sent')} {new Date(data.email_sent_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <textarea
              className={`w-full h-full min-h-[300px] bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none ${isEmailSent ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={t('candidateDrawer.email.draftPlaceholder')}
              value={draft}
              onChange={handleDraftChange}
              disabled={isSending || isEmailSent}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 items-center">
            <div className="flex items-center gap-2 mr-auto text-xs text-zinc-500">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>Error saving</span>
                </>
              )}
            </div>
            <button
              onClick={() => {
                setDraft('');
                saveDraft(''); // Immediate save for clear
              }}
              disabled={isSending || isEmailSent}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('candidateDrawer.email.clear')}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSending || !draft.trim() || isEmailSent}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEmailSent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
              {isSending ? 'Sending...' : isEmailSent ? 'Sent' : t('candidateDrawer.email.send')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInterview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
          <Mic className="w-4 h-4" />
          {t('candidateDrawer.interview.title')}
        </h3>
        <button
          onClick={() => setIsAddingQuestion(!isAddingQuestion)}
          className="text-xs font-bold text-zinc-400 hover:text-white transition-colors border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5"
        >
          {isAddingQuestion ? t('common.cancel') : t('common.add')}
        </button>
      </div>

      {isAddingQuestion && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-purple-500/30 space-y-3 animate-fade-in">
          <input
            type="text"
            placeholder={t('candidateDrawer.interview.questionPlaceholder') || "Question..."}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50"
            autoFocus
          />
          <input
            type="text"
            placeholder={t('candidateDrawer.interview.contextPlaceholder') || "Context (optional)..."}
            value={newContext}
            onChange={(e) => setNewContext(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex justify-end pt-2">
            <button
              onClick={handleAddQuestion}
              disabled={!newQuestion.trim() || isUpdatingQuestions}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUpdatingQuestions ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {normalized.questions.length > 0 ? (
          normalized.questions.map((q, idx) => (
            <div key={idx} className="relative p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-colors group">
              <button
                onClick={() => handleDeleteQuestion(idx)}
                className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title={t('common.delete')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-sm text-zinc-200 font-medium group-hover:text-purple-100 transition-colors pr-6">"{q.question}"</p>
              {q.context && (
                <p className="mt-2 text-xs text-zinc-500 border-t border-white/5 pt-2">
                  <span className="font-semibold text-zinc-400">{t('candidateDrawer.interview.context')}</span> {q.context}
                </p>
              )}
            </div>
          ))
        ) : (
          !isAddingQuestion && (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm italic">{t('candidateDrawer.interview.noQuestions')}</p>
              <button
                onClick={() => setIsAddingQuestion(true)}
                className="mt-4 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                {t('candidateDrawer.interview.addFirst')}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">{t('common.loading')}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-rose-500">
          <AlertTriangle className="w-10 h-10" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      );
    }
    if (!data) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 p-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex justify-between items-start gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-100 leading-tight">
                {data.candidate_name || t('candidateDrawer.header.unknown')}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">{data.current_position || t('common.unknown')}</span>
                <span>•</span>
                <span>{yearsDisplay} {t('candidateDrawer.profile.years')}</span>
                <span>•</span>
                <span>{data.location || t('common.unknown')}</span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(candidateId!, isFavorite || false)}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${isFavorite
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-zinc-100 hover:bg-white text-zinc-950'
                      }`}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
                    {isFavorite ? t('candidateList.actions.favorited') : t('candidateList.actions.favorite')}
                  </button>
                )}

                {onUpdateStatus && (
                  <button
                    onClick={() => onUpdateStatus(candidateId!, status === 'rejected' ? 'new' : 'rejected')}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20'
                        : 'bg-zinc-100 hover:bg-white text-zinc-950'
                      }`}
                  >
                    <ThumbsDown className={`w-4 h-4 ${status === 'rejected' ? 'fill-rose-500' : ''}`} />
                    {status === 'rejected' ? t('candidateList.actions.rejected') : t('candidateList.actions.reject')}
                  </button>
                )}

                <div className="h-8 w-px bg-white/10 mx-1" />

                <button
                  onClick={() => data.email && window.open(`mailto:${data.email}`)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {t('candidateDrawer.header.contact')}
                </button>
                <div className="h-8 w-px bg-white/10 mx-1" />
                {data.email && (
                  <button
                    onClick={() => copyToClipboard(data.email)}
                    className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-xl transition-colors"
                    title={t('candidateDrawer.header.copyEmail')}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {data.phone && (
                  <button
                    onClick={() => copyToClipboard(data.phone)}
                    className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-xl transition-colors"
                    title={t('candidateDrawer.header.copyPhone')}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-400 hover:text-[#0077b5] hover:bg-[#0077b5]/10 rounded-xl transition-colors"
                    title={t('candidateDrawer.header.openLinkedIn')}
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    title={t('candidateDrawer.header.openGithub')}
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
            <div className="group relative cursor-help">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 text-xl font-bold ${getScoreColor(matchScoreValue || 0)}`}>
                {matchScoreValue ?? 0}%
              </div>
              {data.score_justification && (
                <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-xl text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {data.score_justification}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-8 border-b border-white/5">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t('candidateDrawer.tabs.analysis')}
            </button>
            {!hideCommunicationTab && (
              <button
                onClick={() => setActiveTab('communication')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'communication' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                <Mail className="w-3.5 h-3.5" />
                {t('candidateDrawer.tabs.communication')}
              </button>
            )}
            <button
              onClick={() => setActiveTab('interview')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'interview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t('candidateDrawer.tabs.interview')}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === 'analysis' && renderAnalysis()}
          {activeTab === 'communication' && !hideCommunicationTab && renderCommunication()}
          {activeTab === 'interview' && renderInterview()}
          <div className="h-12" />
        </div>
        <div className="shrink-0 p-4 border-t border-white/5 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-zinc-900 text-zinc-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">
                {data.original_resume_name || 'CV Original.pdf'}
              </span>
              <span className="text-xs text-zinc-500">
                {t('candidateDrawer.header.added')} {data.uploaded_at ? new Date(data.uploaded_at).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
          <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            {t('candidateDrawer.preview.openExternal')}
          </button>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end font-sans">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[650px] h-full bg-zinc-950 border-l border-white/10 shadow-2xl animate-slide-in-right flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors z-30"
        >
          <X className="w-6 h-6" />
        </button>
        {renderContent()}
      </div>
    </div>,
    document.body
  );
};

export default CandidateDrawer;
