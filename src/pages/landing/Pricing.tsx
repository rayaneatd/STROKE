
import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';

const Pricing: React.FC = () => {
    const plans = [
        { name: 'Starter', price: '0€', period: '/mo', features: ['10 Scans', '1 Project', '1 Member'], scans: 10, projects: 1, members: 1 },
        { name: 'Essential', price: '19€', period: '/mo', features: ['50 Scans', '3 Projects', '1 Member'], scans: 50, projects: 3, members: 1 },
        { name: 'Pro', price: '49€', period: '/mo', features: ['500 Scans', 'Unlimited Projects', '5 Members'], scans: 500, projects: 'Unlimited', members: 5 },
        { name: 'Team', price: '199€', period: '/mo', features: ['2500 Scans', 'Unlimited Projects', '20 Members'], scans: 2500, projects: 'Unlimited', members: 20 },
        { name: 'Elite', price: '500€', period: '/mo', features: ['10,000 Scans', 'Unlimited Projects', 'Unlimited Members'], scans: 10000, projects: 'Unlimited', members: 'Unlimited' },
    ];

    return (
        <InfoPageWrapper>
            <div className="w-full">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter">
                        Pricing <span className="text-blue-500 not-italic">&</span> Plans
                    </h1>
                    <p className="text-xl text-slate-400 font-light leading-relaxed">
                        Transparent pricing for high-velocity recruitment. Choose the scale that matches your ambition.
                    </p>
                </div>

                <div className="overflow-x-auto glass-card rounded-3xl border border-white/10 mb-20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-8 text-sm font-bold uppercase tracking-widest text-slate-400">Plan</th>
                                <th className="p-8 text-sm font-bold uppercase tracking-widest text-slate-400">Monthly Price</th>
                                <th className="p-8 text-sm font-bold uppercase tracking-widest text-slate-400">Scans / Month</th>
                                <th className="p-8 text-sm font-bold uppercase tracking-widest text-slate-400">Projects</th>
                                <th className="p-8 text-sm font-bold uppercase tracking-widest text-slate-400">Team Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan, i) => (
                                <tr key={plan.name} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${i === 2 ? 'bg-blue-500/5' : ''}`}>
                                    <td className="p-8">
                                        <div className="text-xl font-bold italic">{plan.name}</div>
                                        {i === 2 && <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold bg-blue-500/10 px-2 py-0.5 rounded mt-1 inline-block">Recommended</span>}
                                    </td>
                                    <td className="p-8">
                                        <span className="text-2xl font-black tracking-tight">{plan.price}</span>
                                        <span className="text-slate-500 text-sm">{plan.period}</span>
                                    </td>
                                    <td className="p-8 font-mono text-slate-300">{plan.scans}</td>
                                    <td className="p-8 font-mono text-slate-300">{plan.projects}</td>
                                    <td className="p-8 font-mono text-slate-300">{plan.members}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-card p-10 border-white/5">
                        <h3 className="text-lg font-bold mb-4 italic">No Hidden Fees.</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">All plans include our core extraction engine, multi-tenancy support, and standard email integrations.</p>
                    </div>
                    <div className="glass-card p-10 border-white/5">
                        <h3 className="text-lg font-bold mb-4 italic">Cancel Anytime.</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Switch between plans or cancel your subscription at any time. No lock-in, just performance.</p>
                    </div>
                    <div className="glass-card p-10 border-white/5">
                        <h3 className="text-lg font-bold mb-4 italic">Enterprise Needs?</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Contact us for custom scan limits and dedicated support for organizations processing 50k+ CVs monthly.</p>
                    </div>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default Pricing;
