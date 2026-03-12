import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { ScanSearch, ShieldCheck, Star, Users, Mail, Zap, Braces, Code2, Network } from 'lucide-react';

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
                                    className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.85] text-slate-100 mb-8 italic select-none"
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    {/* Smart Card 1 */}
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ y: -5, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                                        className="p-6 flex flex-col items-start gap-4 border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl transition-all duration-500 group cursor-default rounded-2xl"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                            <Star size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-widest text-sm mb-2 uppercase">Smart Rating</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">Predictive scoring that ranks candidates by cultural and technical trajectory, not just keywords.</p>
                                        </div>
                                    </motion.div>

                                    {/* Smart Card 2 */}
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ y: -5, backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                                        className="p-6 flex flex-col items-start gap-4 border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl transition-all duration-500 group cursor-default rounded-2xl"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                            <Users size={24} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-widest text-sm mb-2 uppercase">Multi-Tenancy</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">Collaborative workspaces for the whole team. Move from isolation to synchronized hiring cycles.</p>
                                        </div>
                                    </motion.div>

                                    {/* Smart Card 3 */}
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ y: -5, backgroundColor: 'rgba(168, 85, 247, 0.05)', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                                        className="p-6 flex flex-col items-start gap-4 border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl transition-all duration-500 group cursor-default rounded-2xl"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                            <Mail size={24} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-widest text-sm mb-2 uppercase">Anti-Ghosting</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">Mass email automation protocol designed to keep candidates in the loop with zero manual effort.</p>
                                        </div>
                                    </motion.div>

                                    {/* Smart Card 4 */}
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ y: -5, backgroundColor: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                                        className="p-6 flex flex-col items-start gap-4 border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl transition-all duration-500 group cursor-default rounded-2xl"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                                            <Zap size={24} className="text-rose-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-widest text-sm mb-2 uppercase">Lighter Engine</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">No bloat. A high-performance, responsive interface built for speed and effortless navigation.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right Side: LUXURY PRO CSS 2D ANIMATION (Replaces 3D TruthLens) */}
                        <div className="relative z-10 order-1 lg:order-2 h-[400px] lg:h-[600px] flex items-center justify-center pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.7, x: 150, filter: 'blur(30px)', rotateY: -30 }}
                                whileInView={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)', rotateY: 0 }}
                                viewport={{ once: false, amount: 0.3 }}
                                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                className="relative w-full max-w-lg aspect-square flex items-center justify-center"
                            >
                                {/* Abstract Visualizer Container */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Glowing central orb */}
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"
                                    />

                                    {/* The Truth Lens Glass Disc */}
                                    <motion.div
                                        animate={{ rotateZ: 360 }}
                                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                        className="absolute w-[80%] h-[80%] rounded-full border border-white/10 bg-gradient-to-br from-blue-500/5 to-transparent backdrop-blur-xl shadow-[inset_0_0_80px_rgba(59,130,246,0.1)] flex items-center justify-center overflow-hidden"
                                    >
                                        {/* Scanner Line passing over */}
                                        <motion.div
                                            animate={{ left: ['-100%', '200%'] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
                                            className="absolute top-0 w-[50%] h-full bg-gradient-to-r from-transparent via-blue-400/20 to-transparent skew-x-[-20deg]"
                                        />
                                    </motion.div>

                                    {/* Floating Code Modules representing extracted JSON data */}
                                    <motion.div
                                        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-[20%] right-[10%] p-4 rounded-xl border border-indigo-500/30 bg-[#0a0a0e]/80 backdrop-blur-md shadow-2xl flex items-center gap-3"
                                    >
                                        <Braces className="text-indigo-400" size={20} />
                                        <div className="flex flex-col gap-1">
                                            <div className="w-16 h-1 bg-indigo-500/40 rounded-full" />
                                            <div className="w-10 h-1 bg-indigo-500/20 rounded-full" />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
                                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        className="absolute bottom-[20%] left-[10%] p-4 rounded-xl border border-emerald-500/30 bg-[#0a0a0e]/80 backdrop-blur-md shadow-2xl flex items-center gap-3"
                                    >
                                        <Network className="text-emerald-400" size={20} />
                                        <div className="flex flex-col gap-1">
                                            <div className="w-12 h-1 bg-emerald-500/40 rounded-full" />
                                            <div className="w-20 h-1 bg-emerald-500/20 rounded-full" />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        animate={{ y: [-15, 15, -15], rotateZ: [-5, 5, -5] }}
                                        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                        className="absolute top-[50%] left-[5%] p-4 rounded-xl border border-blue-500/30 bg-[#0a0a0e]/80 backdrop-blur-md shadow-2xl"
                                    >
                                        <Code2 className="text-blue-400" size={24} />
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Detail overlay */}
                            <motion.div
                                variants={itemVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: false }}
                                className="absolute top-10 right-10 p-8 flex flex-col items-end opacity-40 border-r border-t border-white/10 mix-blend-screen"
                            >
                                <div className="text-[10px] font-mono text-slate-500 tracking-[1em] uppercase mb-4">Extraction.0x2FF</div>
                                <div className="w-24 h-[1px] bg-slate-700" />
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default TheGapSection;
