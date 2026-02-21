import React from 'react';
import { useTranslation } from 'react-i18next';
import { Project } from '../../../types';
import { Brain, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface AIDiagnosticsTabProps {
    formData: Partial<Project>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Project>>>;
    isOwner: boolean;
    isAnalyzing: boolean;
    analysisStep: string;
    analysisResult: any;
    setAnalysisResult: (result: any) => void;
}

const AIDiagnosticsTab: React.FC<AIDiagnosticsTabProps> = ({
    formData,
    setFormData,
    isOwner,
    isAnalyzing,
    analysisStep,
    analysisResult,
    setAnalysisResult
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Brain className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">AI Project Diagnostics</h3>
                    <p className="text-zinc-400 text-sm">Analyze your project configuration and get AI-powered recommendations.</p>
                </div>
            </div>

            <div className="p-8 border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-purple-500 mb-4 opacity-50" />
                <h4 className="text-white font-medium mb-2">Coming Soon</h4>
                <p className="text-zinc-500 max-w-md">
                    Our AI diagnostics tool is currently under development. Soon you'll be able to get intelligent insights about your recruitment pipeline and settings.
                </p>
            </div>
        </div>
    );
};

export default AIDiagnosticsTab;
