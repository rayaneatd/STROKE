import InfoPageWrapper from '../../components/InfoPageWrapper';
import { Brain, Cpu, Database, Network } from 'lucide-react';

const DeepLogic: React.FC = () => {
    return (
        <InfoPageWrapper>
            <div className="max-w-4xl mx-auto mb-24 w-full">
                <div className="max-w-4xl mx-auto mb-24">
                    <span className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block">Platform Architecture</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter leading-none">
                        Deep Logic <br /> Analysis.
                    </h1>
                    <p className="text-xl text-slate-400 font-light leading-relaxed border-l border-blue-500/30 pl-8">
                        STROKE isn't a search engine. It's a contextual reasoning engine built on top of high-density neural networks.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
                    <div className="glass-card p-10 border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8">
                            <Brain size={24} className="text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-6 italic">Neural Contextualization</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Unlike legacy parsers that look for keywords, STROKE analyzes the semantic distance between experiences. It understands that "Building Scalable Infra" at a startup is fundamentally different from the same title at a legacy bank.
                        </p>
                    </div>

                    <div className="glass-card p-10 border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8">
                            <Network size={24} className="text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-6 italic">Relational Graph Mapping</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Every CV is deconstructed into a JSON data graph. We map temporal progressions, skill evolution, and institutional prestige to build a 3D profile of a candidate's trajectory.
                        </p>
                    </div>

                    <div className="glass-card p-10 border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
                            <Database size={24} className="text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-6 italic">Zero-Bias Extraction</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Our algorithms are designed to strip away formatting noise and focus purely on achievements and potential. This ensures that a brilliant candidate isn't discarded due to a poor PDF layout.
                        </p>
                    </div>

                    <div className="glass-card p-10 border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-8">
                            <Cpu size={24} className="text-rose-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-6 italic">Real-Time Inference</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Powered by Google Vertex AI, our inference engine processes complex resumes in under 1.5 seconds, providing instant scoring and red-flag detection.
                        </p>
                    </div>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default DeepLogic;
