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
  MessageSquare
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
  skills: unknown;
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
}

type DrawerTab = 'analysis' | 'communication' | 'interview';

const CandidateDrawer: React.FC<CandidateDrawerProps> = ({ isOpen, candidateId, onClose, hideCommunicationTab = false }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<CandidateDrawerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>('analysis');
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

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
    const keySkills = toStringArray(data?.key_skills);
    const fallbackSkills = toStringArray(data?.skills);
    return {
      keySkills: keySkills.length > 0 ? keySkills : fallbackSkills,
      missingSkills: toStringArray(data?.missing_skills),
      redFlags: toStringArray(data?.red_flags),
      questions: toQuestions(data?.interview_questions)
    };
  }, [data?.key_skills, data?.skills, data?.missing_skills, data?.red_flags, data?.interview_questions]);

  if (!isOpen) return null;

  const matchScoreValue = typeof data?.match_score === 'number' ? data.match_score : null;
  const linkedinUrl = data?.social_links?.linkedin;
  const githubUrl = data?.social_links?.github;

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

  const renderCommunication = () => (
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
            className="w-full h-full min-h-[300px] bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            placeholder={t('candidateDrawer.email.draftPlaceholder')}
            value={draft}
            onChange={handleDraftChange}
            disabled={isSending}
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
            disabled={isSending}
            className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            {t('candidateDrawer.email.clear')}
          </button>
          <button 
            onClick={handleSendEmail}
            disabled={isSending || !draft.trim()}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {isSending ? 'Sending...' : t('candidateDrawer.email.send')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderInterview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
          <Mic className="w-4 h-4" />
          {t('candidateDrawer.interview.title')}
        </h3>
      </div>
      <div className="grid gap-3">
        {normalized.questions.length > 0 ? (
          normalized.questions.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-colors group">
              <p className="text-sm text-zinc-200 font-medium group-hover:text-purple-100 transition-colors">"{q.question}"</p>
              {q.context && (
                <p className="mt-2 text-xs text-zinc-500 border-t border-white/5 pt-2">
                  <span className="font-semibold text-zinc-400">{t('candidateDrawer.interview.context')}</span> {q.context}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-2xl">
            <MessageSquare className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm italic">{t('candidateDrawer.interview.noQuestions')}</p>
          </div>
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
