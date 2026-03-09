import React, { useState } from 'react';
import {
    FileText, TrendingUp, Briefcase, Download, Coins, Users, Target, Activity,
    Filter, Calendar, ChevronDown, CheckCircle, XCircle, Mail, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, Line
} from 'recharts';
import { Project, ProjectFile, User } from '../../../types';
import { useProjectAnalytics, TimeRange } from '../../../hooks/useProjectAnalytics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OverviewTabProps {
    // Legacy props (might still be passed but we'll fetch our own data)
    analytics?: any;
    project: Project;
    files: ProjectFile[];
    topCandidates?: any[];
    contributionData?: any[];
    handleExport: () => void;
    currentUser: User;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    project,
    handleExport,
    currentUser
}) => {
    const { t } = useTranslation();
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

    // Fetch analytics with time range
    const { data: analytics, isLoading } = useProjectAnalytics(project.id, timeRange);

    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';

    // Theme configurations
    const cardClass = isLight
        ? 'bg-white border-slate-200 shadow-sm'
        : 'bg-[#0e0e10] border-white/5 shadow-sm';

    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const textTertiary = isLight ? 'text-slate-400' : 'text-zinc-600';

    const btnClass = isLight
        ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
        : 'bg-white/5 border-white/5 text-zinc-300 hover:text-white hover:bg-white/10';

    if (isLoading || !analytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${isLight ? 'bg-white text-slate-900' : 'bg-zinc-900 text-white'} p-3 border ${isLight ? 'border-slate-200' : 'border-zinc-800'} rounded-lg shadow-xl text-xs`}>
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className={textSecondary}>{entry.name}:</span>
                            <span className="font-mono font-bold">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={`text-lg font-bold ${textPrimary}`}>{t('project.overview.charts.activity')}</h2>
                    <p className={`text-xs ${textSecondary}`}>
                        {t('project.overview.stats.basedOnCandidates', { count: analytics.total })}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Time Range Selector */}
                    <div className={`flex items-center p-1 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900 border-white/5'}`}>
                        {(['7d', '30d', '90d', 'ALL'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${timeRange === range
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : `${textSecondary} hover:${textPrimary}`
                                    }`}
                            >
                                {t(`project.overview.timeRange.${range.toLowerCase()}` as any, range)}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleExport}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors ${btnClass}`}
                    >
                        <Download size={14} /> {t('project.overview.exportReport')}
                    </button>
                </div>
            </div>

            {/* KPI Grid - War Machine Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Volume */}
                <div className={`p-5 rounded-xl border ${cardClass} relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={64} />
                    </div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><Users size={18} /></div>
                        {analytics.completionRate > 0 && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {analytics.completionRate}% {t('project.overview.stats.processed')}
                            </span>
                        )}
                    </div>
                    <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider relative z-10`}>
                        {t('project.overview.kpi.volume')}
                    </h3>
                    <p className={`text-3xl font-bold ${textPrimary} mt-1 relative z-10`}>{analytics.total}</p>
                    <p className={`text-[10px] ${textSecondary} mt-1 relative z-10`}>
                        {analytics.pending} imported today
                    </p>
                </div>

                {/* Qualified */}
                <div className={`p-5 rounded-xl border ${cardClass} relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target size={64} />
                    </div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20"><Target size={18} /></div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {analytics.qualificationRate}% {t('project.overview.kpi.rate')}
                        </span>
                    </div>
                    <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider relative z-10`}>
                        {t('project.overview.kpi.qualified')}
                    </h3>
                    <p className={`text-3xl font-bold ${textPrimary} mt-1 relative z-10`}>{analytics.qualified}</p>
                    <p className={`text-[10px] ${textSecondary} mt-1 relative z-10`}>
                        {t('project.overview.cards.avgScore')}: <span className="text-emerald-400 font-bold">{analytics.avgScore}%</span>
                    </p>
                </div>

                {/* Contacted (Conversion) */}
                <div className={`p-5 rounded-xl border ${cardClass} relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Mail size={64} />
                    </div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20"><Mail size={18} /></div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {analytics.contactRate}% {t('project.overview.kpi.conversion')}
                        </span>
                    </div>
                    <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider relative z-10`}>
                        {t('project.overview.kpi.contacted')}
                    </h3>
                    <p className={`text-3xl font-bold ${textPrimary} mt-1 relative z-10`}>{analytics.contacted}</p>
                    <p className={`text-[10px] ${textSecondary} mt-1 relative z-10`}>
                        {analytics.rejected} {t('project.overview.kpi.rejected').toLowerCase()}
                    </p>
                </div>

                {/* Budget/Velocity */}
                {project.settings?.billingMode === 'PROJECT_INVESTMENT' ? (
                    <div className={`p-5 rounded-xl border ${cardClass} relative overflow-hidden`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20"><Coins size={18} /></div>
                        </div>
                        <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider`}>{t('project.budget')}</h3>
                        <p className={`text-3xl font-bold ${textPrimary} mt-1`}>{project.investmentBalance || 0}</p>
                        <div className="w-full bg-purple-500/10 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(((project.investmentBalance || 0) / (project.totalInvested || 1)) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className={`p-5 rounded-xl border ${cardClass} relative overflow-hidden`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20"><Activity size={18} /></div>
                        </div>
                        <h3 className={`${textSecondary} text-[10px] font-bold uppercase tracking-wider`}>{t('project.overview.kpi.velocity')}</h3>
                        <p className={`text-3xl font-bold ${textPrimary} mt-1`}>
                            {analytics.timelineData.length > 0
                                ? Math.round(analytics.total / analytics.timelineData.length * 10) / 10
                                : 0}
                            <span className="text-xs font-normal text-slate-400 ml-1">/ jour</span>
                        </p>
                        <p className={`text-[10px] ${textSecondary} mt-1`}>
                            {t('project.overview.charts.activity')}
                        </p>
                    </div>
                )}
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Chart (2 cols) */}
                <div className={`lg:col-span-2 p-6 rounded-xl border ${cardClass}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`text-sm font-bold ${textPrimary} flex items-center gap-2`}>
                            <TrendingUp size={16} className="text-emerald-500" />
                            {t('project.overview.charts.activity')}
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.timelineData}>
                                <defs>
                                    <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#27272a'} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke={isLight ? '#94a3b8' : '#52525b'}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(str) => {
                                        try {
                                            return format(new Date(str), 'dd MMM', { locale: fr });
                                        } catch (e) {
                                            return str;
                                        }
                                    }}
                                />
                                <YAxis
                                    stroke={isLight ? '#94a3b8' : '#52525b'}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="added"
                                    name={t('project.overview.kpi.volume')}
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorAdded)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="qualified"
                                    name={t('project.overview.kpi.qualified')}
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorQualified)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="failed"
                                    name={t('project.overview.kpi.failed')}
                                    stroke="#ef4444"
                                    fillOpacity={1}
                                    fill="url(#colorFailed)"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgScore"
                                    name={t('project.overview.cards.avgScore')}
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: isLight ? '#fff' : '#0e0e10' }}
                                />
                                <defs>
                                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Funnel Chart (1 col) */}
                <div className={`p-6 rounded-xl border ${cardClass}`}>
                    <h3 className={`text-sm font-bold ${textPrimary} mb-6 flex items-center gap-2`}>
                        <Filter size={16} className="text-purple-500" />
                        {t('project.overview.charts.funnel')}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={analytics.funnelData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isLight ? '#e2e8f0' : '#27272a'} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="stage"
                                    type="category"
                                    stroke={isLight ? '#64748b' : '#a1a1aa'}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    width={60}
                                    tickFormatter={(value) => t(`project.overview.funnel.${value}` as any, value)}
                                />
                                <Tooltip
                                    cursor={{ fill: isLight ? '#f1f5f9' : '#18181b' }}
                                    content={<CustomTooltip />}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                                    {analytics.funnelData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Distribution & Team */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <div className={`p-6 rounded-xl border ${cardClass}`}>
                    <h3 className={`text-sm font-bold ${textPrimary} mb-6 flex items-center gap-2`}>
                        <Target size={16} className="text-orange-500" />
                        {t('project.overview.charts.distribution')}
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? '#e2e8f0' : '#27272a'} />
                                <XAxis
                                    dataKey="range"
                                    stroke={isLight ? '#94a3b8' : '#52525b'}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke={isLight ? '#94a3b8' : '#52525b'}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: isLight ? '#f1f5f9' : '#18181b' }}
                                    content={<CustomTooltip />}
                                />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Failure Analysis */}
                <div className={`p-6 rounded-xl border ${cardClass}`}>
                    <h3 className={`text-sm font-bold ${textPrimary} mb-6 flex items-center gap-2`}>
                        <AlertTriangle size={16} className="text-red-500" />
                        {t('project.overview.charts.failures')}
                    </h3>
                    <div className="h-[250px] w-full relative">
                        {analytics.failureDistribution && analytics.failureDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.failureDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {analytics.failureDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6'][index % 6]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value, entry: any) => (
                                            <span className={`${textSecondary} text-[10px]`}>{entry.payload.reason} ({entry.payload.count})</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <CheckCircle size={32} className="mb-2 text-emerald-500 opacity-50" />
                                <span className="text-xs">{t('project.overview.noFailures')}</span>
                            </div>
                        )}

                        {/* Center Total */}
                        {analytics.failureDistribution && analytics.failureDistribution.length > 0 && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                                <span className={`text-2xl font-bold ${textPrimary}`}>{analytics.recentFailures}</span>
                                <p className={`text-[10px] ${textSecondary} uppercase`}>Total</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Performance - Accurate Event-Based */}
                <div className={`p-6 rounded-xl border ${cardClass} col-span-1 md:col-span-2`}>
                    <h3 className={`text-sm font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
                        <Users size={16} className="text-blue-500" />
                        {t('project.overview.charts.team')} <span className="text-[10px] font-normal text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full ml-2">{t('project.overview.team.accuracy')}</span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                    <th className={`py-3 px-2 text-[10px] uppercase tracking-wider ${textSecondary}`}>{t('project.overview.team.rank')}</th>
                                    <th className={`py-3 px-2 text-[10px] uppercase tracking-wider ${textSecondary}`}>{t('project.overview.team.member')}</th>
                                    <th className={`py-3 px-2 text-[10px] uppercase tracking-wider ${textSecondary} text-right`}>{t('project.overview.team.sourced')}</th>
                                    <th className={`py-3 px-2 text-[10px] uppercase tracking-wider ${textSecondary} text-right`}>{t('project.overview.team.qualified')}</th>
                                    <th className={`py-3 px-2 text-[10px] uppercase tracking-wider ${textSecondary} text-right`}>{t('project.overview.team.rejected')}</th>
                                    <th className={`py-3 px-2 text-[10px] uppercase tracking-wider ${textSecondary} text-right`}>{t('project.overview.team.contacted')}</th>
                                    <th className={`py-3 px-2 text-[10px] uppercase tracking-wider ${textSecondary} text-right`}>{t('project.overview.team.efficiency')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.contributionData.map((member: any, index: number) => {
                                    const user = project.members.find(m => m.userId === member.userId)?.user;
                                    const decisions = member.qualified + member.rejected;
                                    const efficiency = decisions > 0 ? Math.round((member.qualified / decisions) * 100) : 0;

                                    return (
                                        <tr key={member.userId} className={`border-b ${isLight ? 'border-slate-50' : 'border-white/5'} hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors`}>
                                            <td className="py-3 px-2">
                                                <div className={`w-6 h-6 rounded-full ${index < 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'} flex items-center justify-center text-[10px] font-bold`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    {user?.avatarUrl ? (
                                                        <img src={user.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                            {user?.displayName?.[0] || 'U'}
                                                        </div>
                                                    )}
                                                    <span className={`text-xs font-bold ${textPrimary}`}>{user?.displayName || t('candidateList.unknownUser')}</span>
                                                </div>
                                            </td>
                                            <td className={`py-3 px-2 text-right text-xs font-mono ${textPrimary}`}>{member.scans}</td>
                                            <td className="py-3 px-2 text-right text-xs font-mono text-emerald-500 font-bold">{member.qualified}</td>
                                            <td className={`py-3 px-2 text-right text-xs font-mono ${textSecondary}`}>{member.rejected}</td>
                                            <td className="py-3 px-2 text-right text-xs font-mono text-amber-500">{member.contacted}</td>
                                            <td className="py-3 px-2 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${efficiency}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold ${textSecondary}`}>{efficiency}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {analytics.contributionData.length === 0 && (
                            <div className={`text-center py-12 ${textSecondary} text-xs italic`}>
                                {t('project.overview.team.noActivity')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
