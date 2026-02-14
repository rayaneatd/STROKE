
import React from 'react';
import { FileText, TrendingUp, Briefcase, Download } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Project, ProjectFile, User } from '../../types';

interface OverviewTabProps {
    analytics: any;
    project: Project;
    files: ProjectFile[];
    topCandidates: any[];
    contributionData: any[];
    handleExport: () => void;
    currentUser: User;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    analytics,
    project,
    files,
    topCandidates,
    contributionData,
    handleExport,
    currentUser
}) => {
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';

    const cardClass = isLight
        ? 'bg-white border-slate-200 shadow-sm'
        : 'bg-[#0e0e10] border-white/5 shadow-sm';

    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const textTertiary = isLight ? 'text-slate-400' : 'text-zinc-600';

    const btnClass = isLight
        ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
        : 'bg-white/5 border-white/5 text-zinc-300 hover:text-white hover:bg-white/10';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-end">
                <button
                    onClick={handleExport}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors ${btnClass}`}
                >
                    <Download size={14} /> Export Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-xl border ${cardClass}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><FileText size={18} /></div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                    </div>
                    <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider`}>Total Resumes</h3>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{analytics.total}</p>
                    <p className={`text-[10px] ${textSecondary} mt-1`}>{analytics.completed} analyzed, {analytics.pending} pending</p>
                </div>

                <div className={`p-5 rounded-xl border ${cardClass}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20"><TrendingUp size={18} /></div>
                    </div>
                    <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider`}>Avg. Score</h3>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{analytics.avgScore}%</p>
                    <p className={`text-[10px] ${textSecondary} mt-1`}>Based on {analytics.completed} candidates</p>
                </div>

                <div className={`p-5 rounded-xl border ${cardClass}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20"><Briefcase size={18} /></div>
                    </div>
                    <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider`}>Team Members</h3>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{project.members.length}</p>
                    <p className={`text-[10px] ${textSecondary} mt-1`}>Contributed {contributionData.reduce((a, b) => a + b.scans, 0)} scans</p>
                </div>

                <div className={`bg-gradient-to-br from-${accentColor}-600 to-${accentColor}-700 p-5 rounded-xl shadow-lg text-white border border-white/10 relative overflow-hidden`}>
                    <h3 className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-2 relative z-10">Insight</h3>
                    <p className="text-base font-bold leading-tight relative z-10">
                        {topCandidates.length > 2 ? `${topCandidates.length} excellent candidates found with scores > 80%!` : "Keep uploading resumes to find better matches."}
                    </p>
                    <div className="mt-4 w-full bg-black/20 h-1 rounded-full overflow-hidden relative z-10">
                        <div className="bg-white h-full rounded-full" style={{ width: `${(analytics.completed / (analytics.total || 1)) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-white/70 mt-1 font-medium relative z-10">Analysis {Math.round((analytics.completed / (analytics.total || 1)) * 100)}% complete</p>

                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-6 rounded-xl border ${cardClass}`}>
                    <h3 className={`text-sm font-bold ${textPrimary} mb-6`}>Upload Activity</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.timelineData}>
                                <defs>
                                    <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? "#f1f5f9" : "#27272a"} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isLight ? '#94a3b8' : '#71717a', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: isLight ? '#94a3b8' : '#71717a', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: isLight ? '#fff' : '#18181b', borderRadius: '8px', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', color: isLight ? '#0f172a' : '#fff' }}
                                    cursor={{ fill: isLight ? '#f8fafc' : '#ffffff', opacity: isLight ? 1 : 0.05 }}
                                />
                                <Area type="monotone" dataKey="applications" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorApplications)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`p-6 rounded-xl border ${cardClass}`}>
                    <h3 className={`text-sm font-bold ${textPrimary} mb-4`}>Top Candidates</h3>
                    <div className="space-y-2">
                        {topCandidates.map((c, i) => (
                            <div key={c.id} className={`flex items-center justify-between p-2 rounded-lg transition-colors border border-transparent ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-zinc-500'}`}>#{i + 1}</div>
                                    <div className="overflow-hidden">
                                        <div className={`font-bold text-xs truncate w-24 sm:w-auto ${textPrimary}`}>{c.candidateName}</div>
                                        <div className={`text-[10px] ${textTertiary}`}>{new Date(c.uploadedAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="text-right"><span className="text-sm font-bold text-emerald-400">{c.score}%</span></div>
                            </div>
                        ))}
                        {topCandidates.length === 0 && <div className={`text-xs text-center py-4 ${textTertiary}`}>No analyzed candidates yet.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
