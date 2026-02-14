
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Line, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
    Users, TrendingUp, TrendingDown, Target, Activity,
    Download, RefreshCw, ChevronDown, Calendar, Filter, Star, Info, Crown, CheckCircle, AlertOctagon, FileStack, Briefcase, Search, BarChart2, Shield
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { User, Role } from '../types';
import LowCreditsBanner from '../components/LowCreditsBanner';

interface DashboardProps {
    currentUser: User;
    onNavigate: (page: string) => void;
}

const KpiCard = React.memo(({ title, value, trendValue, icon, color, subtext, isLight }: any) => {
    const isPositive = trendValue && trendValue.startsWith('+');

    // Light mode uses "Card" styling: Pure white background, subtle shadow, clean border.
    const cardClass = isLight
        ? 'bg-white border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'
        : 'bg-[#0e0e10] border-white/5 hover:border-opacity-80';

    return (
        <div className={`${cardClass} p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('bg-', 'text-')}`}>
                {React.cloneElement(icon, { size: 64 })}
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl ${isLight ? 'bg-slate-50 text-slate-500 border border-slate-100' : 'bg-white/5 text-zinc-400'} group-hover:text-current transition-colors`}>
                    {React.cloneElement(icon, { size: 20 })}
                </div>
                {trendValue && trendValue !== '-' && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${isPositive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <div className={`text-3xl font-bold ${isLight ? 'text-slate-800' : 'text-white'} tracking-tight mb-1`}>{value}</div>
                <h3 className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} text-xs font-semibold uppercase tracking-wide`}>{title}</h3>
                {subtext && <p className={`${isLight ? 'text-slate-400' : 'text-zinc-600'} text-[10px] mt-2 truncate font-mono`}>{subtext}</p>}
            </div>
        </div>
    );
});

const TeamRoleCard = React.memo(({ title, count, icon, color, desc, isLight }: any) => (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isLight ? 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
        <div className={`p-2.5 rounded-full ${isLight ? 'bg-slate-50 text-slate-500 shadow-sm border border-slate-100' : 'bg-white/5 text-zinc-400'}`}>
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <div className="min-w-0">
            <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{count}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide truncate ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>{title}</span>
            </div>
            <div className={`text-[10px] leading-none truncate mt-1 ${isLight ? 'text-slate-400 font-medium' : 'text-zinc-600'}`}>{desc}</div>
        </div>
    </div>
));

// Custom Tooltip for Charts
const CustomChartTooltip = ({ active, payload, label, isLight }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className={`${isLight ? 'bg-white border-slate-100 text-slate-700 shadow-xl' : 'bg-[#18181b] border-white/10 text-zinc-200 shadow-xl'} border p-3 rounded-xl text-xs backdrop-blur-md`}>
                <p className={`${isLight ? 'text-slate-400' : 'text-zinc-400'} mb-2 font-mono uppercase tracking-wider text-[10px]`}>{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                        <span className="font-bold">{entry.name}:</span>
                        <span className="font-mono">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate }) => {
    const {
        loading,
        data,
        exportMenuOpen,
        setExportMenuOpen,
        timeRange,
        setTimeRange,
        statusFilter,
        setStatusFilter,
        ownerFilter,
        setOwnerFilter,
        handleManualRefresh,
        handleExport,
        totalErrors,
        failedFileCount,
        errorRate
    } = useDashboard({ currentUser });

    // THEME DETECTION
    const theme = currentUser.preferences?.uiConfig?.theme || 'DARK';
    const isLight = theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';

    if (!data) return (
        <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <RefreshCw className={`animate-spin text-${accentColor}-500`} size={24} />
                <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Loading Intelligence...</p>
            </div>
        </div>
    );

    // Common card container class for Light/Dark
    const cardContainerClass = isLight
        ? 'bg-white border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        : 'bg-[#0e0e10] border-white/5 shadow-sm';

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <LowCreditsBanner balance={currentUser.scansBalance} onBuy={() => onNavigate('buy-scans')} />

            {/* --- HEADER CONTROLS --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold flex items-center gap-3 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Performance Overview
                        {loading && <div className={`w-2 h-2 bg-${accentColor}-500 rounded-full animate-pulse`}></div>}
                    </h1>
                    <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Real-time business intelligence across your organization</p>
                </div>

                {/* Analytics Filter Toolbar */}
                <div className={`flex flex-col md:flex-row flex-wrap items-center gap-3 w-full xl:w-auto p-1.5 rounded-xl border ${isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-white/5 border-white/5'}`}>

                    <div className="relative group w-full md:w-auto">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(parseInt(e.target.value))}
                            className={`w-full md:w-auto pl-3 pr-8 py-1.5 bg-transparent text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-zinc-300 focus:text-white hover:bg-white/5'}`}
                        >
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value={7}>Last 7 Days</option>
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value={14}>Last 14 Days</option>
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value={30}>Last 30 Days</option>
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value={90}>Last 3 Months</option>
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value={365}>Last Year</option>
                        </select>
                        <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                    </div>

                    <div className={`w-px h-4 hidden md:block ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                    <div className="relative group w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className={`w-full md:w-auto pl-3 pr-8 py-1.5 bg-transparent text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-zinc-300 focus:text-white hover:bg-white/5'}`}
                        >
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ALL">All Statuses</option>
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ACTIVE">Active Projects</option>
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="COMPLETED">Completed</option>
                            <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ARCHIVED">Archived</option>
                        </select>
                        <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                    </div>

                    {currentUser.role === Role.ADMIN && (
                        <>
                            <div className={`w-px h-4 hidden md:block ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
                            <div className="relative group w-full md:w-auto">
                                <select
                                    value={ownerFilter}
                                    onChange={(e) => setOwnerFilter(e.target.value as any)}
                                    className={`w-full md:w-auto pl-3 pr-8 py-1.5 bg-transparent text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-zinc-300 focus:text-white hover:bg-white/5'}`}
                                >
                                    <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ALL">Organization</option>
                                    <option className={isLight ? "bg-white" : "bg-[#18181b]"} value="ME">My Projects</option>
                                </select>
                                <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                            </div>
                        </>
                    )}

                    <div className={`w-px h-4 hidden md:block mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                    <button
                        onClick={handleManualRefresh}
                        className={`p-1.5 transition-colors rounded-lg ${loading ? `animate-spin text-${accentColor}-500` : isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        title="Force Refresh Data"
                        disabled={loading}
                    >
                        <RefreshCw size={14} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isLight ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm' : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/5'}`}
                        >
                            <Download size={12} /> Export
                        </button>
                        {exportMenuOpen && (
                            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl border overflow-hidden z-20 animate-fade-in-up ${isLight ? 'bg-white border-slate-100' : 'bg-[#18181b] border-white/10'}`}>
                                <button onClick={() => handleExport('CSV')} className={`w-full text-left px-4 py-3 text-xs font-medium border-b border-dashed ${isLight ? 'text-slate-600 hover:bg-slate-50 border-slate-100' : 'text-zinc-300 hover:text-white hover:bg-white/5 border-white/10'}`}>Export CSV</button>
                                <button onClick={() => handleExport('JSON')} className={`w-full text-left px-4 py-3 text-xs font-medium ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-zinc-300 hover:text-white hover:bg-white/5'}`}>Export JSON</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- BUSINESS KPI ROW --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Total Uploads"
                    value={data.kpi.totalCandidates}
                    trendValue={data.kpi.candidateTrend}
                    icon={<FileStack />}
                    color="bg-blue-500"
                    subtext={`${data.kpi.analyzedCount} processed`}
                    isLight={isLight}
                />
                <KpiCard
                    title="Qualified Candidates"
                    value={`${data.kpi.qualifiedRate}%`}
                    trendValue={data.kpi.qualifiedTrend}
                    icon={<Target />}
                    color="bg-emerald-500"
                    subtext="Score > 80%"
                    isLight={isLight}
                />
                <KpiCard
                    title="Active Projects"
                    value={data.kpi.activeProjects}
                    trendValue="-"
                    icon={<Star />}
                    color="bg-amber-500"
                    subtext="Recruiting now"
                    isLight={isLight}
                />
                <KpiCard
                    title="System Throughput"
                    value={data.kpi.avgTimeProcessing}
                    trendValue=""
                    icon={<Activity />}
                    color="bg-violet-500"
                    subtext="Avg. parse time"
                    isLight={isLight}
                />
            </div>

            {/* --- TEAM COMPOSITION ROW (COMPACT GRID) --- */}
            <div className={`${cardContainerClass} rounded-2xl p-6 border`}>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Team Capacity</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <TeamRoleCard
                        title="Admins"
                        count={data.teamStats.admins}
                        icon={<Shield />}
                        color="bg-zinc-500"
                        desc="Full Access"
                        isLight={isLight}
                    />
                    <TeamRoleCard
                        title="Partners"
                        count={data.teamStats.partners}
                        icon={<Briefcase />}
                        color="bg-purple-500"
                        desc="Scan & Analyze"
                        isLight={isLight}
                    />
                    <TeamRoleCard
                        title="Scouts"
                        count={data.teamStats.scouts}
                        icon={<Search />}
                        color={`bg-${accentColor}-500`}
                        desc="Sourcing Only"
                        isLight={isLight}
                    />
                    <TeamRoleCard
                        title="Analysts"
                        count={data.teamStats.analysts}
                        icon={<BarChart2 />}
                        color="bg-blue-500"
                        desc="View Only"
                        isLight={isLight}
                    />
                </div>
            </div>

            {/* --- ANALYTICS CHARTS ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart: Volume vs Quality */}
                <div className={`lg:col-span-2 p-6 rounded-2xl border flex flex-col ${cardContainerClass}`}>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Volume & Quality Trends</h3>
                            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Application influx vs. match score</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wide">
                            <div className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-slate-300' : 'bg-zinc-700'}`}></div><span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Volume</span></div>
                            <div className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-full bg-${accentColor}-500`}></div><span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Avg Score</span></div>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? "#f1f5f9" : "#27272a"} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isLight ? '#94a3b8' : '#71717a', fontSize: 10, fontWeight: 600 }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: isLight ? '#94a3b8' : '#71717a', fontSize: 10, fontWeight: 600 }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                                <Tooltip content={<CustomChartTooltip isLight={isLight} />} cursor={{ fill: isLight ? '#f8fafc' : '#ffffff', opacity: isLight ? 1 : 0.05 }} />
                                <Bar yAxisId="left" dataKey="applications" barSize={32} radius={[4, 4, 0, 0]} fill={isLight ? "#e2e8f0" : "#27272a"} />
                                <Line yAxisId="right" type="monotone" dataKey="avgQuality" stroke={`#${accentColor === 'amber' ? 'f59e0b' : accentColor === 'emerald' ? '10b981' : accentColor === 'rose' ? 'f43f5e' : accentColor === 'violet' ? '8b5cf6' : accentColor === 'cyan' ? '06b6d4' : '0ea5e9'}`} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: `#${accentColor === 'amber' ? 'f59e0b' : accentColor === 'emerald' ? '10b981' : accentColor === 'rose' ? 'f43f5e' : accentColor === 'violet' ? '8b5cf6' : accentColor === 'cyan' ? '06b6d4' : '0ea5e9'}`, stroke: isLight ? '#fff' : '#000', strokeWidth: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Failure Analysis */}
                <div className={`p-6 rounded-2xl border flex flex-col ${cardContainerClass}`}>
                    <div className="mb-4 flex justify-between items-start">
                        <div>
                            <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Failure Analysis</h3>
                            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Processing errors</p>
                        </div>
                        {failedFileCount > 0 && (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold">
                                <AlertOctagon size={12} />
                                {errorRate}%
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-h-[180px] flex flex-col justify-center">
                        {totalErrors === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isLight ? 'bg-emerald-50 text-emerald-500 shadow-sm border border-emerald-100' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                    <CheckCircle size={28} />
                                </div>
                                <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>100% Success Rate</h4>
                                <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>All files processed successfully.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-center py-4 relative">
                                    <div className="w-[140px] h-[140px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.errorData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {data.errorData?.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomChartTooltip isLight={isLight} />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className={`text-2xl font-bold leading-none ${isLight ? 'text-slate-800' : 'text-white'}`}>{totalErrors}</span>
                                        <span className={`text-[10px] font-bold uppercase mt-1 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Errors</span>
                                    </div>
                                </div>

                                <div className="flex-1 w-full space-y-3 overflow-y-auto max-h-[150px] custom-scrollbar pr-1 pl-1 mt-2">
                                    {data.errorData.map((item: any, index: number) => {
                                        const percentage = ((item.value / totalErrors) * 100);
                                        return (
                                            <div key={index} className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }}></span>
                                                        <span className={`font-bold truncate ${isLight ? 'text-slate-600' : 'text-zinc-400'}`} title={item.name}>{item.name}</span>
                                                    </div>
                                                    <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>{item.value}</span>
                                                </div>
                                                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${percentage}%`, backgroundColor: item.fill }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- BOTTOM ROW: LEADERBOARD --- */}
            <div className={`rounded-2xl border overflow-hidden ${cardContainerClass}`}>
                <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-center gap-2 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                    <div>
                        <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Project Performance</h3>
                        <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Top performing recruitment campaigns</p>
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className={`text-[10px] uppercase tracking-wider font-bold border-b ${isLight ? 'bg-slate-50/50 text-slate-500 border-slate-100' : 'bg-white/5 text-zinc-500 border-white/5'}`}>
                                <th className="px-6 py-4">Project Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Candidates</th>
                                <th className="px-6 py-4 text-right">Qualified</th>
                                <th className="px-6 py-4 text-right">Avg. Score</th>
                                <th className="px-6 py-4">Efficiency</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                            {data.projectPerformance.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={`px-5 py-8 text-center text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                                        No projects match your current filters.
                                    </td>
                                </tr>
                            ) : (
                                data.projectPerformance.map((project: any) => {
                                    const efficiency = (project.qualified / (project.candidates || 1)) * 100;
                                    return (
                                        <tr key={project.id} className={`transition-colors group cursor-pointer ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                            <td className="px-6 py-4">
                                                <div className={`font-bold text-sm transition-colors ${isLight ? 'text-slate-700 group-hover:text-slate-900' : 'text-zinc-200 group-hover:text-white'}`}>{project.name}</div>
                                                <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>ID: {project.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${project.status === 'ACTIVE' ? `bg-${accentColor}-500/10 text-${accentColor}-500 border-${accentColor}-500/20` : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-semibold text-sm ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>{project.candidates}</td>
                                            <td className="px-6 py-4 text-right font-bold text-sm text-emerald-500">{project.qualified}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>{project.avgScore}%</span>
                                                    <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-zinc-800'}`}>
                                                        <div className={`h-full rounded-full ${project.avgScore > 75 ? 'bg-blue-500' : isLight ? 'bg-slate-400' : 'bg-zinc-600'}`} style={{ width: `${project.avgScore}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 text-xs font-bold ${isLight ? 'text-slate-600' : 'text-zinc-500'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${efficiency > 30 ? 'bg-emerald-500' : efficiency > 15 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                                    {Math.round(efficiency)}% Conv.
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
