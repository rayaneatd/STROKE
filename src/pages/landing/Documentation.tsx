
import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';
import { Book, Code, Terminal, Zap } from 'lucide-react';

const Documentation: React.FC = () => {
    return (
        <InfoPageWrapper>
            <div className="w-full">
                <div className="max-w-4xl mx-auto mb-24">
                    <span className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block">Knowledge Base</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter leading-none">
                        Docs.
                    </h1>
                    <p className="text-xl text-slate-400 font-light leading-relaxed">
                        Everything you need to integrate and master the STROKE engine.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                    {[
                        { icon: <Book size={20} />, title: 'Getting Started', desc: 'Step-by-step guide to your first workspace setup.' },
                        { icon: <Terminal size={20} />, title: 'API Reference', desc: 'Full documentation for our REST and GraphQL APIs.' },
                        { icon: <Code size={20} />, title: 'SDKs', desc: 'Official libraries for Python, Node.js, and Go.' },
                        { icon: <Zap size={20} />, title: 'Webhooks', desc: 'Real-time notifications for extraction events.' },
                        { icon: <Terminal size={20} />, title: 'CLI Tool', desc: 'Manage massive CV batches from your terminal.' },
                        { icon: <Book size={20} />, title: 'Custom Logic', desc: 'How to train the engine on your specific hiring criteria.' },
                    ].map((card, i) => (
                        <div key={i} className="glass-card p-8 border-white/5 hover:border-blue-500/20 transition-all group cursor-pointer">
                            <div className="text-blue-400 mb-6 group-hover:scale-110 transition-transform">{card.icon}</div>
                            <h3 className="text-lg font-bold mb-3 italic">{card.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="glass-card p-12 border-white/5 bg-slate-900/50">
                    <h2 className="text-2xl font-bold mb-8 italic">Quick Integration Example</h2>
                    <pre className="bg-black/50 p-8 rounded-xl border border-white/5 overflow-x-auto text-sm font-mono text-blue-300">
                        {`const stroke = require('@stroke/sdk');

// Initialize with your API Key
const client = stroke.init('sk_live_....');

// Analyze CV with contextual logic
const result = await client.analyze('./resume.pdf', {
  focus: ['distributed_systems', 'leadership'],
  min_score: 85
});

console.log(result.score); // 92
console.log(result.contextual_match); // "Extreme Signal"`}
                    </pre>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default Documentation;
