import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Play, ArrowRight, ShieldCheck, Database, Zap } from 'lucide-react';

interface CinematicProofSectionProps {
    onCTA: () => void;
    isAuthenticated?: boolean;
}

const CinematicProofSection: React.FC<CinematicProofSectionProps> = ({ onCTA, isAuthenticated }) => {
    const ref = useRef(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 150, rotateX: -20, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            transition: {
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.7, filter: 'blur(20px)', y: 60, rotateZ: 3 },
        visible: {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            y: 0,
            rotateZ: 0,
            transition: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }
        }
    };

    return (
        <section
            id="witness"
            ref={ref}
            className="relative w-full py-16 z-40 bg-[#0e0e10] overflow-hidden"
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Left Side: Text and Beta Results */}
                    <div className="lg:col-span-11 xl:col-span-10 lg:col-start-2 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

                        {/* Text Content Block */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                            className="relative z-20 order-2 lg:order-1 lg:pr-8"
                        >
                            <motion.div variants={itemVariants}>
                                <motion.div
                                    animate={{
                                        opacity: [0.6, 1, 0.6],
                                        rotate: [0, 1, -1, 0]
                                    }}
                                    transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                    className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8 backdrop-blur-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                                >
                                    <ShieldCheck size={16} className="text-blue-500" />
                                    <span className="text-[11px] font-mono font-black uppercase tracking-[0.5em] text-blue-400">Beta Results</span>
                                </motion.div>

                                <motion.h2
                                    variants={itemVariants}
                                    className="text-3xl md:text-5xl font-black tracking-tighter leading-[1] text-slate-100 mb-8 italic"
                                >
                                    Built for High-Volume <br />
                                    <span className="not-italic text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 drop-shadow-2xl">Workflows.</span>
                                </motion.h2>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-base md:text-lg text-slate-400 max-w-md mb-8 leading-relaxed font-light border-l-4 border-blue-500/20 pl-6"
                                >
                                    STROKE isn't just a theory. It's a specialized layer for high-volume recruitment where every second counts.
                                </motion.p>

                                <div className="flex flex-col gap-4.5 relative">
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02, x: 8 }}
                                        className="glass-card p-4.5 flex items-start gap-4.5 border-blue-500/10 shadow-3xl transition-all duration-500 group cursor-default rounded-xl bg-blue-500/5"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                            <Zap size={20} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-widest text-[13px] mb-1 uppercase">1,500+ Resumes Analyzed</h4>
                                            <p className="text-slate-500 text-[11px] leading-relaxed">Battle-tested through our private beta phase with independent recruiters.</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02, x: 8 }}
                                        className="glass-card p-4.5 flex items-start gap-4.5 border-blue-500/10 shadow-3xl transition-all duration-500 group cursor-default rounded-xl bg-blue-500/5"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                            <Database size={20} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-widest text-[13px] mb-1 uppercase">Zero-Data Retention</h4>
                                            <p className="text-slate-500 text-[11px] leading-relaxed">Your data stays yours. We never use candidate info to train public models.</p>
                                        </div>
                                    </motion.div>
                                </div>

                                <motion.div
                                    variants={itemVariants}
                                    className="mt-12 flex flex-col md:flex-row gap-6"
                                >
                                    <motion.button
                                        animate={{
                                            boxShadow: [
                                                "0 15px 30px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.2)",
                                                "0 15px 30px rgba(0,0,0,0.4), 0 0 40px rgba(59,130,246,0.4)",
                                                "0 15px 30px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.2)"
                                            ]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        onClick={onCTA}
                                        className="relative z-10 glass-button px-8 py-4 text-base font-black tracking-tighter text-white flex items-center gap-4 bg-blue-600 border-blue-400/30 hover:bg-blue-500 transition-all rounded-full group"
                                    >
                                        <span className="relative z-10">
                                            {isAuthenticated ? 'Return to App' : 'Start Free Beta'}
                                        </span>
                                        <motion.div
                                            animate={{ x: [0, 6, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="relative z-10"
                                        >
                                            <ArrowRight size={18} />
                                        </motion.div>
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Right Side: Video Scene */}
                        <div className="relative z-10 order-1 lg:order-2 h-[300px] lg:h-[500px] flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.6, rotateZ: -10, filter: 'blur(40px)', y: 100 }}
                                whileInView={{ opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)', y: 0 }}
                                viewport={{ once: false, amount: 0.3 }}
                                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                                className="relative w-full aspect-video rounded-[1.5rem] overflow-hidden glass-card border border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.2)] group"
                            >
                                <iframe
                                    className="w-full h-full relative z-0"
                                    src="" /*https://www.youtube.com/embed/cq5UKAv_zsg?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1*/
                                    title="STROKE Demo"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
                            </motion.div>

                            {/* Detail overlay */}
                            {/*<motion.div
                                variants={itemVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: false }}
                                className="absolute bottom-10 left-1/2 -translate-x-1/2 p-8 flex flex-col items-center pointer-events-none opacity-40 bg-[#0e0e10]/80 backdrop-blur-xl border border-white/5 rounded-2xl"
                            >
                                <div className="text-[10px] font-mono text-blue-500/80 tracking-[0.8em] uppercase mb-2">Operation.0x3FF</div>
                                <div className="w-24 h-[1px] bg-blue-500/20" />
                            </motion.div>*/}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default CinematicProofSection;
