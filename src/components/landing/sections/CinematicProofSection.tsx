import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';

interface CinematicProofSectionProps {
    onCTA: () => void;
}

const CinematicProofSection: React.FC<CinematicProofSectionProps> = ({ onCTA }) => {
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
            className="relative w-full py-24 z-40 bg-[#0e0e10] overflow-hidden"
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[180px] pointer-events-none"></div>

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
                                        opacity: [0.6, 1, 0.6],
                                        rotate: [0, 1, -1, 0]
                                    }}
                                    transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                    className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 mb-10 backdrop-blur-2xl shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                                >
                                    <Play size={18} className="text-orange-500 fill-current shadow-orange-500" />
                                    <span className="text-[12px] font-mono font-black uppercase tracking-[0.5em] text-orange-400">Live Operation</span>
                                </motion.div>

                                <motion.h2
                                    variants={itemVariants}
                                    className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.8] text-slate-100 mb-10 italic"
                                >
                                    Witness <br />
                                    <span className="not-italic text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-red-500 to-orange-600 drop-shadow-2xl">Precision.</span>
                                </motion.h2>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-xl text-slate-400 max-w-lg mb-12 leading-relaxed font-light border-l-4 border-orange-500/20 pl-10"
                                >
                                    STROKE isn't a theory. It's a live data processing workbench. Watch the engine decode contextual talent trajectory in <span className="text-orange-400 font-bold">real-time</span>.
                                </motion.p>

                                <div className="grid grid-cols-1 gap-6 relative">
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02, x: 10 }}
                                        className="glass-card p-10 flex items-start gap-8 border-orange-500/10 shadow-3xl transition-all duration-500 group cursor-default rounded-3xl bg-orange-500/5"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                                            <Play size={32} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-black font-mono tracking-widest text-lg mb-3 uppercase">Neural Playback</h4>
                                            <p className="text-slate-500 text-base leading-relaxed">Observe the extraction cycles as they happen. Zero latency. Infinite precision.</p>
                                        </div>
                                    </motion.div>
                                </div>

                                <motion.div
                                    variants={itemVariants}
                                    className="mt-20 flex flex-col md:flex-row gap-8"
                                >
                                    <motion.button
                                        animate={{
                                            boxShadow: [
                                                "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(249,115,22,0.2)",
                                                "0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(249,115,22,0.4)",
                                                "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(249,115,22,0.2)"
                                            ]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        onClick={onCTA}
                                        className="relative z-10 glass-button px-12 py-6 text-xl font-black tracking-tighter text-white flex items-center gap-6 bg-orange-500/10 border-orange-500/20 hover:border-orange-500/60 transition-all rounded-full group"
                                    >
                                        <span className="relative z-10">Launch Workbench</span>
                                        <motion.div
                                            animate={{ x: [0, 8, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="relative z-10"
                                        >
                                            <ArrowRight size={24} />
                                        </motion.div>
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Right Side: Video Scene */}
                        <div className="relative z-10 order-1 lg:order-2 h-[400px] lg:h-[700px] flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.6, rotateZ: -10, filter: 'blur(40px)', y: 100 }}
                                whileInView={{ opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)', y: 0 }}
                                viewport={{ once: false, amount: 0.3 }}
                                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                                className="relative w-full aspect-video rounded-[3rem] overflow-hidden glass-card border border-white/10 shadow-[0_0_80px_rgba(249,115,22,0.2)] group"
                            >
                                <iframe
                                    className="w-full h-full relative z-0"
                                    src="https://www.youtube.com/embed/cq5UKAv_zsg?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1"
                                    title="STROKE Cinematic Demo"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
                            </motion.div>

                            {/* Detail overlay */}
                            <motion.div
                                variants={itemVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: false }}
                                className="absolute bottom-10 left-1/2 -translate-x-1/2 p-10 flex flex-col items-center pointer-events-none opacity-40 bg-[#0e0e10]/80 backdrop-blur-xl border border-white/5 rounded-2xl"
                            >
                                <div className="text-[12px] font-mono text-orange-500/80 tracking-[0.8em] uppercase mb-4">Neural.0x3FF</div>
                                <div className="w-32 h-[2px] bg-orange-500/20" />
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default CinematicProofSection;
