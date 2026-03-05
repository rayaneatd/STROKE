import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { ScanSearch, ShieldCheck } from 'lucide-react';
import TruthLensCanvas from './TruthLensCanvas';

const TheGapSection: React.FC = () => {
    const ref = useRef(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0, x: -150, skewX: 5 },
        visible: {
            opacity: 1,
            x: 0,
            skewX: 0,
            transition: {
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.8, filter: 'blur(15px)', y: 50 },
        visible: {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: { duration: 1, ease: [0.34, 1.56, 0.64, 1] }
        }
    };

    return (
        <section
            id="the-gap"
            ref={ref}
            className="relative min-h-screen w-full py-24 z-30 overflow-hidden bg-[#0c0c0e]"
        >
            {/* Ambient Background Lighting */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent z-0 opacity-40"></div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

                    {/* Left Side: Overlapping Governance Cards */}
                    <div className="lg:col-span-11 xl:col-span-10 lg:col-start-2 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Text Content Block */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                            className="relative z-20 order-2 lg:order-1 lg:pr-12"
                        >
                            <motion.div variants={itemVariants}>
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
                                    variants={itemVariants}
                                    className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.85] text-slate-100 mb-8 italic"
                                >
                                    Read the <br />
                                    <span className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 underline decoration-blue-500/20 underline-offset-8">Matrix.</span>
                                </motion.h2>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-lg md:text-xl text-slate-400 max-w-lg mb-12 leading-relaxed font-light border-l-2 border-blue-500/20 pl-8 italic"
                                >
                                    See past the PDF formatting. STROKE extracts the underlying <span className="text-slate-100 font-bold not-italic">JSON data graph</span>, instantly highlighting temporal gaps and pattern anomalies.
                                </motion.p>

                                <div className="grid grid-cols-1 gap-8 relative">
                                    {/* Tactile Governance Cards */}
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ x: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                        className="glass-card p-8 flex items-start gap-8 border-white/5 shadow-3xl transition-all duration-500 group cursor-default rounded-2xl"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                            <ScanSearch size={28} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-black font-mono tracking-widest text-base mb-3 uppercase">JSON Extraction</h4>
                                            <p className="text-slate-500 text-sm leading-relaxed">Deconstructs legacy documents into clean, semantic primitive objects for deep AI analysis.</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ x: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                                        className="glass-card p-8 flex items-start gap-8 border-white/5 shadow-3xl transition-all duration-500 group cursor-default rounded-2xl"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                            <ShieldCheck size={28} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-black font-mono tracking-widest text-base mb-3 uppercase">Temporal Auditing</h4>
                                            <p className="text-slate-500 text-sm leading-relaxed">Identifies career progression speed and identifies "hidden gems" by analyzing time-to-impact.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right Side: 3D Scene */}
                        <div className="relative z-10 order-1 lg:order-2 h-[400px] lg:h-[600px] flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.7, x: 150, filter: 'blur(30px)', rotateY: -30 }}
                                whileInView={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)', rotateY: 0 }}
                                viewport={{ once: false, amount: 0.3 }}
                                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                className="absolute inset-[-100px] lg:inset-[-150px] pointer-events-auto cursor-grab active:cursor-grabbing"
                            >
                                <TruthLensCanvas />
                            </motion.div>

                            {/* Detail overlay */}
                            <motion.div
                                variants={itemVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: false }}
                                className="absolute top-10 right-10 p-8 flex flex-col items-end pointer-events-none opacity-40 border-r border-t border-white/10"
                            >
                                <div className="text-[10px] font-mono text-slate-600 tracking-[1em] uppercase mb-4">Extraction.0x2FF</div>
                                <div className="w-24 h-[1px] bg-slate-800" />
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default TheGapSection;
