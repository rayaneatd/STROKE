import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Server, Lock } from 'lucide-react';
import FortressCanvas from './FortressCanvas';

const FortressSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section
            id="fortress"
            ref={ref}
            className="relative min-h-screen w-full py-24 overflow-hidden bg-[#0a0a0c]"
        >
            {/* Ambient Background Glow matching the 3D scene */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>

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
                                        opacity: [0.4, 1, 0.4],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 mb-8 backdrop-blur-xl"
                                >
                                    <ShieldCheck size={16} className="text-blue-400 animate-pulse" />
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-blue-300">Hardened Intelligence</span>
                                </motion.div>

                                <motion.h2
                                    animate={{
                                        x: [0, -5, 5, 0],
                                        skewY: [0, 0.5, -0.5, 0]
                                    }}
                                    transition={{
                                        duration: 15,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                    className="text-4xl md:text-6xl font-black tracking-tight leading-[0.9] text-slate-100 mb-8 italic"
                                >
                                    Enterprise <br />
                                    <span className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Fortification.</span>
                                </motion.h2>

                                <motion.p
                                    animate={{
                                        opacity: [0.8, 1, 0.8]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                    className="text-lg text-slate-400 max-w-lg mb-8 leading-relaxed font-light border-l-2 border-slate-800 pl-8"
                                >
                                    We don't "trust" AI. We govern it. STROKE is a fortified processing engine engineered on Google Cloud's most secure <span className="text-slate-200">EU infrastructure</span>.
                                </motion.p>

                                <motion.button
                                    whileHover={{ scale: 1.05, x: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-3 text-blue-400 font-mono text-[10px] tracking-[0.3em] uppercase mb-12 hover:text-blue-300 transition-colors pl-8"
                                    onClick={() => window.location.href = '/privacy-policy'}
                                >
                                    [ Read Privacy Policy ]
                                </motion.button>

                                <div className="grid grid-cols-1 gap-6 relative">
                                    {/* Tactile Governance Cards */}
                                    <motion.div
                                        animate={{
                                            y: [0, -8, 0],
                                            rotate: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 7,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        whileHover={{ x: 10, borderColor: 'rgba(59, 130, 246, 0.3)' }}
                                        className="glass-card p-6 flex items-start gap-6 border-white/5 shadow-2xl transition-all duration-300 group cursor-default"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Server size={22} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-wide text-sm mb-2">Vertex AI (europe-west9)</h4>
                                            <p className="text-slate-500 text-sm leading-snug">Data residency locked in Paris. Zero data egress from the European Union.</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        animate={{
                                            y: [0, 8, 0],
                                            rotate: [0, -1, 0]
                                        }}
                                        transition={{
                                            duration: 9,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 1
                                        }}
                                        whileHover={{ x: 10, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                        className="glass-card p-6 flex items-start gap-6 border-white/5 shadow-2xl transition-all duration-300 group cursor-default"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Lock size={22} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-wide text-sm mb-2">RGPD-Native</h4>
                                            <p className="text-slate-500 text-sm leading-snug">Automated PII anonymization. Zero model training on proprietary candidate intelligence.</p>
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
                                <FortressCanvas />
                            </motion.div>

                            {/* Magazine detail overlay */}
                            <div className="absolute top-0 right-0 p-8 flex flex-col items-end pointer-events-none opacity-40">
                                <div className="text-[10px] font-mono text-slate-600 tracking-[0.5em] uppercase mb-2">Structure.0x1FF</div>
                                <div className="w-16 h-[1px] bg-slate-800" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default FortressSection;
