import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- Types ---

interface CandidateDrawerData {
  candidate_name: string | null;
  current_position: string | null;
  years_of_experience: number | null;
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
  soft_skills_analysis: string | null;
  key_skills: string[] | null;
  missing_skills: string[] | null;
  red_flags: string[] | null;
  interview_questions: {
    question: string;
    context?: string;
  }[] | null;
  original_resume_name: string | null;
  uploaded_at: string | null;
}

interface CandidateDrawerProps {
  isOpen: boolean;
  candidateId: string | null;
  onClose: () => void;
}

// --- Component ---

const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  isOpen,
  candidateId,
  onClose
}) => {
  const [data, setData] = useState<CandidateDrawerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!candidateId || !isOpen) return;

      setLoading(true);
      setError(null);
      setData(null);

      try {
        const { data, error } = await supabase
          .rpc('get_candidate_drawer_data', { p_candidate_id: candidateId });

        if (error) throw error;
        
        // Handle single row return from RPC (it might return an array of 1)
        const candidateData = Array.isArray(data) ? data[0] : data;
        
        if (!candidateData) {
          throw new Error('Candidat introuvable');
        }

        setData(candidateData);
      } catch (err: any) {
        console.error('Error fetching candidate data:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidateId, isOpen]);

  // Prevent scrolling on body when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Helpers ---

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const copyToClipboard = (text: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text);
      // Could add a toast here
    }
  };

  // --- Render Content ---

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Analyse du profil en cours...</p>
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
        {/* 1. Header Sticky */}
        <div className="shrink-0 p-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex justify-between items-start gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-100 leading-tight">
                {data.candidate_name || 'Candidat sans nom'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">{data.current_position || 'Poste inconnu'}</span>
                <span>•</span>
                <span>{data.years_of_experience ?? 0} ans d'exp</span>
                <span>•</span>
                <span>{data.location || 'Lieu non spécifié'}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <button 
                  onClick={() => window.open(`mailto:${data.email}`)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contacter
                </button>
                
                <div className="h-8 w-px bg-white/10 mx-1" />

                {data.email && (
                  <button onClick={() => copyToClipboard(data.email)} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-xl transition-colors" title="Copier l'email">
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {data.phone && (
                  <button onClick={() => copyToClipboard(data.phone)} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-xl transition-colors" title="Copier le téléphone">
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                {data.social_links?.linkedin && (
                  <a href={data.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-[#0077b5] hover:bg-[#0077b5]/10 rounded-xl transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {data.social_links?.github && (
                  <a href={data.social_links.github} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="group relative cursor-help">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 text-xl font-bold ${getScoreColor(data.match_score || 0)}`}>
                {data.match_score ?? 0}%
              </div>
              {data.score_justification && (
                <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-xl text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {data.score_justification}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* 2. Executive Verdict */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/5">
            {data.career_trajectory && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" />
                {data.career_trajectory}
              </div>
            )}
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Executive Verdict</h3>
            <p className="text-zinc-200 leading-relaxed text-sm">
              {data.executive_summary || "Aucun résumé exécutif disponible."}
            </p>
          </div>

          {/* 3. Risk Management (Conditional) */}
          {data.red_flags && data.red_flags.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-950/10 border border-rose-500/20">
              <h3 className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider mb-4">
                <AlertTriangle className="w-4 h-4" />
                Points d'attention
              </h3>
              <ul className="space-y-2">
                {data.red_flags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-rose-200/80">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Gap Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matches */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                Compétences Validées
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.key_skills?.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    {skill}
                  </span>
                )) || <span className="text-zinc-500 text-xs italic">Aucune compétence détectée</span>}
              </div>
            </div>

            {/* Gaps */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <XCircle className="w-4 h-4" />
                Compétences Manquantes
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.missing_skills?.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 text-xs font-medium decoration-zinc-700">
                    {skill}
                  </span>
                )) || <span className="text-zinc-500 text-xs italic">Aucun manque identifié</span>}
              </div>
            </div>
          </div>

          {/* 5. Soft Skills & Culture */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Soft Skills & Culture</h3>
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5">
              <p className="text-zinc-300 text-sm leading-relaxed">
                {data.soft_skills_analysis || "Analyse non disponible."}
              </p>
            </div>
          </div>

          {/* 6. Actionable: Interview Prep */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Mic className="w-4 h-4" />
              Questions d'entretien suggérées
            </h3>
            <div className="grid gap-3">
              {data.interview_questions?.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-colors group">
                  <p className="text-sm text-zinc-200 font-medium group-hover:text-purple-100 transition-colors">"{q.question}"</p>
                  {q.context && (
                    <p className="mt-2 text-xs text-zinc-500 border-t border-white/5 pt-2">
                      <span className="font-semibold text-zinc-400">Contexte :</span> {q.context}
                    </p>
                  )}
                </div>
              )) || <p className="text-zinc-500 text-sm italic">Aucune question générée.</p>}
            </div>
          </div>

          <div className="h-12" /> {/* Spacer */}
        </div>

        {/* 7. Footer Sticky */}
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
                Importé le {data.uploaded_at ? new Date(data.uploaded_at).toLocaleDateString() : 'Date inconnue'}
              </span>
            </div>
          </div>
          
          <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Voir le CV
          </button>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-[600px] h-full bg-zinc-950 border-l border-white/10 shadow-2xl animate-slide-in-right flex flex-col">
        {/* Close Button Absolute */}
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
