import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ScanSearch, ShieldCheck } from 'lucide-react';
import TruthLensCanvas from './TruthLensCanvas';

const TheGapSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section
            id="the-gap"
            ref={ref}
            className="relative min-h-screen w-full py-24 z-30 overflow-hidden"
        >
            {/* Ambient Background Lighting */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e10] via-blue-900/5 to-[#0e0e10] z-0"></div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

                    {/* Left Side: Overlapping Governance Cards */}
                    <div className="lg:col-span-11 xl:col-span-10 lg:col-start-2 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Text Content Block (Asymmetrical Offset) */}
                        <div className="relative z-20 order-2 lg:order-1 lg:pr-12">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <motion.div
                                    animate={{
                                        opacity: [0.5, 1, 0.5],
                                        y: [0, -4, 0]
                                    }}
                                    transition={{
                                        duration: 6,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 mb-8 backdrop-blur-xl"
                                >
                                    <ScanSearch size={16} className="text-blue-400 animate-pulse" />
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-blue-300">Contextual Extraction</span>
                                </motion.div>

                                <motion.h2
                                    animate={{
                                        rotateX: [0, 5, -5, 0],
                                        y: [0, 4, 0]
                                    }}
                                    transition={{
                                        duration: 18,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="text-4xl md:text-6xl font-black tracking-tight leading-[0.9] text-slate-100 mb-8 italic"
                                >
                                    Read the <br />
                                    <span className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Matrix.</span>
                                </motion.h2>

                                <motion.p
                                    animate={{
                                        x: [0, 3, -3, 0]
                                    }}
                                    transition={{ duration: 12, repeat: Infinity }}
                                    className="text-lg text-slate-400 max-w-lg mb-8 leading-relaxed font-light border-l-2 border-slate-800 pl-8"
                                >
                                    See past the PDF formatting. STROKE extracts the underlying JSON data graph, instantly highlighting temporal gaps and pattern anomalies.
                                </motion.p>

                                <div className="grid grid-cols-1 gap-6 relative">
                                    {/* Tactile Governance Cards */}
                                    <motion.div
                                        animate={{
                                            x: [0, 5, 0],
                                            rotateY: [0, 2, 0]
                                        }}
                                        transition={{
                                            duration: 10,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        whileHover={{ x: 10, borderColor: 'rgba(59, 130, 246, 0.3)' }}
                                        className="glass-card p-6 flex items-start gap-6 border-white/5 shadow-2xl transition-all duration-300 group cursor-default"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <ScanSearch size={22} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-wide text-sm mb-2">JSON Extraction</h4>
                                            <p className="text-slate-500 text-sm leading-snug">Extracts the underlying data graph, instantly highlighting temporal gaps and pattern anomalies.</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        animate={{
                                            x: [0, -5, 0],
                                            rotateY: [0, -2, 0]
                                        }}
                                        transition={{
                                            duration: 12,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 0.5
                                        }}
                                        whileHover={{ x: 10, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                        className="glass-card p-6 flex items-start gap-6 border-white/5 shadow-2xl transition-all duration-300 group cursor-default"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <ShieldCheck size={22} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-wide text-sm mb-2">Temporal Auditing</h4>
                                            <p className="text-slate-500 text-sm leading-snug">Automated auditing of temporal data. Zero data egress from the European Union.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Side: 3D Scene (Overlap design) */}
                        <div className="relative z-10 order-1 lg:order-2 h-[400px] lg:h-[600px] flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                                animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.9, rotateY: 20 }}
                                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                className="absolute inset-[-100px] lg:inset-[-150px] pointer-events-auto cursor-grab active:cursor-grabbing"
                            >
                                <TruthLensCanvas />
                            </motion.div>

                            {/* Magazine detail overlay */}
                            <div className="absolute top-0 right-0 p-8 flex flex-col items-end pointer-events-none opacity-40">
                                <div className="text-[10px] font-mono text-slate-600 tracking-[0.5em] uppercase mb-2">Extraction.0x2FF</div>
                                <div className="w-16 h-[1px] bg-slate-800" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default TheGapSection;
