
import React, { useState } from 'react';
import { 
    TrendingUp, TrendingDown, DollarSign, Activity, Users, 
    Zap, Layers, ArrowRight, MousePointer, Target, Globe, Server, 
    CreditCard, MapPin, Clock, AlertCircle, CheckCircle2, Cpu
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// --- TYPES ---

interface ExecutiveData {
    financials: {
        arr: number;
        netMRR: number;
        grossMRR: number;
        netProfit: number;
        profitMargin: number;
        ltv: number;
        cac: number;
        paybackPeriod: string;
        arpu: number;
    };
    costs: {
        totalAiCost: number;
        infraCost: number;
        tokenBurn: number;
    };
    geo: {
        revenue: { name: string; value: number }[];
        users: { name: string; value: number }[];
    };
    charts: {
        revenueHistory: any[];
        cohorts: any[];
        planMix: any[];
    };
}

interface AdminOverviewProps {
    data: ExecutiveData; 
    totalUsers: number;
    isLight?: boolean;
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, trend, trendValue, icon: Icon, colorClass, isLight }: any) => {
    const isPositive = trend === 'up';
    
    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${isLight ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md' : 'bg-[#0e0e10] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}>
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 ${colorClass}`}>
                <Icon size={64} />
            </div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-100' : 'bg-white/5 border border-white/5'} ${colorClass.replace('text-', 'text-opacity-80 ')}`}>
                    <Icon size={20} className={colorClass} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {trendValue}
                </div>
            </div>
            
            <div className="relative z-10">
                <div className={`text-2xl font-black tracking-tight mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {value}
                </div>
                <div className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    {title}
                </div>
            </div>
        </div>
    );
};

const ActivityItem = ({ title, time, type, isLight }: any) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={14} className="text-emerald-500" />;
            case 'warning': return <AlertCircle size={14} className="text-amber-500" />;
            case 'error': return <AlertCircle size={14} className="text-rose-500" />;
            default: return <Activity size={14} className="text-blue-500" />;
        }
    };

    return (
        <div className={`flex gap-3 py-3 border-b last:border-0 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
            <div className={`mt-0.5 shrink-0 ${isLight ? 'bg-slate-50' : 'bg-white/5'} p-1.5 rounded-lg h-fit`}>
                {getIcon()}
            </div>
            <div>
                <p className={`text-xs font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{title}</p>
                <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>{time}</span>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const AdminOverview: React.FC<AdminOverviewProps> = ({ data, totalUsers, isLight }) => {
    const { financials, costs, charts, geo } = data;
    const { accent, styles } = useTheme();
    const [timeRange, setTimeRange] = useState('L30D');

    // Chart customization based on theme
    const gridColor = isLight ? '#e2e8f0' : '#27272a';
    const textColor = isLight ? '#64748b' : '#71717a';
    const tooltipBg = isLight ? '#fff' : '#18181b';
    const tooltipBorder = isLight ? '#e2e8f0' : '#27272a';

    const cardBase = isLight 
        ? 'bg-white border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]' 
        : 'bg-[#0e0e10] border-white/5 shadow-black/20';

    return (
        <div className="space-y-6">
            
            {/* Header / Controls */}
            <div className={`p-2 rounded-xl border flex justify-between items-center ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/5'}`}>
                <div className="flex items-center gap-2 px-2">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>System Operational</span>
                </div>
                <div className={`flex p-1 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                    {['24H', '7D', 'L30D', 'YTD'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                timeRange === t 
                                ? (isLight ? 'bg-white text-slate-900 shadow-sm' : `bg-zinc-700 text-white shadow-sm`)
                                : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-zinc-500 hover:text-white')
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Net MRR" 
                    value={`$${(financials.netMRR / 1000).toFixed(1)}k`} 
                    trend="up" 
                    trendValue="+12%" 
                    icon={DollarSign} 
                    colorClass="text-emerald-500" 
                    isLight={isLight} 
                />
                <StatCard 
                    title="Total Users" 
                    value={totalUsers.toLocaleString()} 
                    trend="up" 
                    trendValue="+5%" 
                    icon={Users} 
                    colorClass="text-blue-500" 
                    isLight={isLight} 
                />
                <StatCard 
                    title="AI Token Burn" 
                    value={`${(costs.tokenBurn / 1000000).toFixed(1)}M`} 
                    trend="down" 
                    trendValue="-2%" 
                    icon={Cpu} 
                    colorClass="text-purple-500" 
                    isLight={isLight} 
                />
                <StatCard 
                    title="Avg. LTV" 
                    value={`$${financials.ltv}`} 
                    trend="up" 
                    trendValue="+8%" 
                    icon={Target} 
                    colorClass="text-amber-500" 
                    isLight={isLight} 
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue & Operations Chart (2/3 width) */}
                <div className={`lg:col-span-2 rounded-2xl border p-6 flex flex-col h-[420px] ${cardBase}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                <Activity size={18} className="text-blue-500"/> Revenue Velocity
                            </h3>
                            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Compare Gross Revenue vs. Net Profit</p>
                        </div>
                        <div className="flex gap-4 text-[10px] font-mono font-medium">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Gross MRR
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Net Profit
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: textColor, fontSize: 10, fontWeight: 600}} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: textColor, fontSize: 10, fontWeight: 600}} 
                                    tickFormatter={(v) => `$${v/1000}k`} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: isLight ? '#0f172a' : '#fff' }}
                                    cursor={{ stroke: isLight ? '#cbd5e1' : '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="retained" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorGross)" name="Gross MRR" />
                                <Area type="monotone" dataKey="new" stackId="2" stroke="#10b981" strokeWidth={2} fill="url(#colorNet)" name="Net Profit" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Breakdown & Margins (1/3 width) */}
                <div className="flex flex-col gap-6">
                    {/* Cost Circle */}
                    <div className={`flex-1 rounded-2xl border p-6 ${cardBase}`}>
                        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <Zap size={16} className="text-amber-500"/> Infrastructure Load
                        </h3>
                        <div className="relative h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'AI Compute', value: costs.totalAiCost, fill: '#f43f5e' },
                                            { name: 'Database', value: costs.infraCost, fill: isLight ? '#94a3b8' : '#52525b' },
                                            { name: 'Margin', value: financials.grossMRR - costs.totalAiCost - costs.infraCost, fill: '#10b981' }
                                        ]}
                                        cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={70}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#f43f5e"/>
                                        <Cell fill={isLight ? '#cbd5e1' : '#3f3f46'}/>
                                        <Cell fill="#10b981"/>
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    {financials.profitMargin}%
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Margin</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 mt-2">
                            <div className={`flex justify-between text-xs font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> AI Compute</span>
                                <span className="font-mono">${costs.totalAiCost.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between text-xs font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                                <span className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-300' : 'bg-zinc-600'}`}></div> Infra</span>
                                <span className="font-mono">${costs.infraCost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Regional Map List (Simplified) */}
                    <div className={`flex-1 rounded-2xl border p-5 flex flex-col ${cardBase}`}>
                        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <Globe size={16} className="text-indigo-500"/> Global Revenue
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                            {geo.revenue.map((item, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                                            <MapPin size={10} /> {item.name}
                                        </span>
                                        <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>${(item.value / 1000).toFixed(1)}k</span>
                                    </div>
                                    <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(item.value / Math.max(...geo.revenue.map(g => g.value))) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Cohorts & Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Feed */}
                <div className={`rounded-2xl border p-6 lg:col-span-1 ${cardBase}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <Server size={16} className="text-emerald-500"/> Live Activity
                        </h3>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        <ActivityItem title="New Enterprise subscription" time="2m ago" type="success" isLight={isLight} />
                        <ActivityItem title="High volume API scan (500 files)" time="15m ago" type="info" isLight={isLight} />
                        <ActivityItem title="Failed payment webhook" time="42m ago" type="error" isLight={isLight} />
                        <ActivityItem title="Database backup completed" time="1h ago" type="success" isLight={isLight} />
                        <ActivityItem title="New user registration" time="1h ago" type="info" isLight={isLight} />
                        <ActivityItem title="Latency spike detected (us-east)" time="2h ago" type="warning" isLight={isLight} />
                    </div>
                </div>

                {/* Cohort Heatmap */}
                <div className={`rounded-2xl border p-6 lg:col-span-2 flex flex-col ${cardBase}`}>
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <Layers size={16} className="text-purple-500"/> Retention Cohorts
                    </h3>
                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr>
                                    <th className={`p-2 text-left font-medium ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Cohort</th>
                                    {[...Array(6)].map((_, i) => <th key={i} className={`p-2 text-center font-medium ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>M{i}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {charts.cohorts.map((row, i) => (
                                    <tr key={i}>
                                        <td className={`p-2 font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                                            {row.month} <span className={`text-[10px] font-normal ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>({row.initialSize})</span>
                                        </td>
                                        {row.retention.map((pct: number, j: number) => {
                                            // Dynamic Color Intensity
                                            let bgClass = '';
                                            let textClass = '';
                                            if (pct >= 90) { bgClass = 'bg-emerald-500'; textClass = 'text-black font-bold'; }
                                            else if (pct >= 75) { bgClass = 'bg-emerald-500/40'; textClass = 'text-emerald-100'; }
                                            else if (pct >= 50) { bgClass = 'bg-blue-500/30'; textClass = 'text-blue-100'; }
                                            else if (pct >= 25) { bgClass = isLight ? 'bg-slate-200' : 'bg-zinc-800'; textClass = isLight ? 'text-slate-500' : 'text-zinc-400'; }
                                            else { bgClass = 'bg-rose-500/10'; textClass = 'text-rose-500'; }

                                            return (
                                                <td key={j} className="p-1">
                                                    <div className={`w-full py-2 flex items-center justify-center rounded-lg transition-all hover:scale-105 cursor-default ${bgClass} ${textClass}`}>
                                                        {pct}%
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
