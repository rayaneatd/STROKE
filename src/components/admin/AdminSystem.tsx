
import React from 'react';
import { Server, Lock, Zap } from 'lucide-react';

const SYSTEM_LOGS = [
    { id: 1, type: 'INFO', msg: 'System backup completed successfully.', time: '2 mins ago' },
    { id: 2, type: 'WARN', msg: 'High CPU usage detected on Node-3.', time: '15 mins ago' },
    { id: 3, type: 'SUCCESS', msg: 'New deployment v2.4.0 is live.', time: '1 hour ago' },
    { id: 4, type: 'INFO', msg: 'User database re-indexing finished.', time: '3 hours ago' },
    { id: 5, type: 'ERROR', msg: 'Failed payment webhook from Stripe.', time: '5 hours ago' },
    { id: 6, type: 'INFO', msg: 'Daily analytics aggregation started.', time: '12 hours ago' },
];

interface AdminSystemProps {
    isLight?: boolean;
}

const AdminSystem: React.FC<AdminSystemProps> = ({ isLight }) => {
    
    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-400';
    const logBg = isLight ? 'bg-slate-900 text-slate-200' : 'bg-[#0e0e10] text-zinc-300';
    const borderClass = isLight ? 'border-slate-200' : 'border-white/5';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            <div className={`rounded-3xl p-8 font-mono text-sm relative overflow-hidden shadow-2xl border ${isLight ? 'border-slate-300' : 'border-white/5'} ${logBg}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"></div>
                <div className={`flex justify-between items-center mb-6 border-b pb-4 ${isLight ? 'border-slate-700' : 'border-white/10'}`}>
                    <h3 className={`font-bold flex items-center gap-2 ${isLight ? 'text-white' : 'text-white'}`}><Server size={18}/> Live System Logs</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-500">LIVE</span>
                    </div>
                </div>
                <div className="space-y-4">
                    {SYSTEM_LOGS.map((log) => (
                        <div key={log.id} className="flex gap-3">
                            <span className={`${isLight ? 'text-slate-500' : 'text-zinc-600'} shrink-0 select-none`}>[{log.time}]</span>
                            <span className={`font-bold ${
                                log.type === 'ERROR' ? 'text-red-500' : 
                                log.type === 'WARN' ? 'text-amber-500' : 
                                log.type === 'SUCCESS' ? 'text-emerald-500' : 'text-blue-400'
                            }`}>{log.type}</span>
                            <span className={isLight ? 'text-slate-300' : 'text-zinc-300'}>{log.msg}</span>
                        </div>
                    ))}
                    <div className="animate-pulse text-zinc-600 pt-2">_</div>
                </div>
            </div>

            <div className="space-y-6">
                <div className={`p-6 rounded-3xl border ${cardBg}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 ${textPrimary}`}><Lock size={18} className={textSecondary}/> Security Overview</h3>
                    <div className="space-y-4">
                        <div className={`flex justify-between items-center p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                            <span className={`text-sm font-medium ${textSecondary}`}>Failed Login Attempts (24h)</span>
                            <span className="font-bold text-red-400">12</span>
                        </div>
                        <div className={`flex justify-between items-center p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                            <span className={`text-sm font-medium ${textSecondary}`}>Active Sessions</span>
                            <span className="font-bold text-brand-400">48</span>
                        </div>
                        <div className={`flex justify-between items-center p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                            <span className={`text-sm font-medium ${textSecondary}`}>WAF Blocked Requests</span>
                            <span className={`font-bold ${textPrimary}`}>1,240</span>
                        </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br p-6 rounded-3xl shadow-lg border ${isLight ? 'from-slate-800 to-slate-900 border-slate-700 text-white' : 'from-brand-900 to-indigo-950 border-white/10 text-white'}`}>
                    <h3 className="font-bold mb-2 flex items-center gap-2"><Zap size={18}/> System Status</h3>
                    <p className="text-brand-200 text-sm mb-6 opacity-80">All systems are operating normally. Next scheduled maintenance in 14 days.</p>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-80">
                            <span>Database (Primary)</span>
                            <span className="text-white">Healthy</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full w-full"></div>
                        </div>

                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-80 mt-2">
                            <span>AI Engine API</span>
                            <span className="text-white">99.9% Uptime</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: '99%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSystem;
