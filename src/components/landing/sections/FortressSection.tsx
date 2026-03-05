import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Server, Lock } from 'lucide-react';
import FortressCanvas from './FortressCanvas';

const FortressSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative min-h-[100svh] w-full py-24 overflow-hidden bg-[#0a0a0c]">
            {/* Ambient Background Glow matching the 3D scene */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-6 h-full flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">

                    {/* Left Typography Side */}
                    <div className="relative z-10 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 mb-6 backdrop-blur-md">
                                <ShieldCheck size={14} className="text-blue-400" />
                                <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-300">The Fortress</span>
                            </div>

                            <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-tight text-slate-100 mb-6">
                                Enterprise-Grade <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Governance.</span>
                            </h2>

                            <p className="text-lg text-slate-400 max-w-lg mb-10 leading-relaxed">
                                Neutralize "AI Skepticism" instantly. STROKE is not a weekend GPT wrapper. It's a fortified data processing engine built on Google Cloud's most secure EU infrastructure.
                            </p>

                            <div className="space-y-4 mb-10">
                                {/* Hover Badges */}
                                <div className="glass-card p-4 flex items-start gap-4 hover:border-blue-500/30 transition-colors group cursor-default">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Server size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-slate-200 font-bold font-mono tracking-wide text-sm mb-1">Vertex AI europe-west9</h4>
                                        <p className="text-slate-500 text-sm">100% Data Residency in Paris. Zero data leaves the European Union.</p>
                                    </div>
                                </div>

                                <div className="glass-card p-4 flex items-start gap-4 hover:border-emerald-500/30 transition-colors group cursor-default">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Lock size={18} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-slate-200 font-bold font-mono tracking-wide text-sm mb-1">Strict RGPD Compliance</h4>
                                        <p className="text-slate-500 text-sm">Automated PII detection and localized processing. Zero training on your proprietary candidate data.</p>
                                    </div>
                                </div>
                            </div>

                            <button className="glass-button text-blue-400 text-sm tracking-wide group hover:text-blue-300">
                                <span className="relative z-10 border-b border-transparent group-hover:border-blue-400 transition-colors pb-0.5">Review Privacy Protocol</span>
                            </button>
                        </motion.div>
                    </div>

                    {/* Right 3D Canvas Side */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative z-10 order-1 lg:order-2 h-full min-h-[400px] lg:min-h-full flex items-center justify-center"
                    >
                        <div className="absolute inset-x-0 bottom-0 top-10 lg:inset-[-100px] pointer-events-auto cursor-grab active:cursor-grabbing">
                            <FortressCanvas />
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default FortressSection;
