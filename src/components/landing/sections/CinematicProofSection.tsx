import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';

interface CinematicProofSectionProps {
    onCTA: () => void;
}

const CinematicProofSection: React.FC<CinematicProofSectionProps> = ({ onCTA }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section
            id="witness"
            ref={ref}
            className="relative w-full py-24 z-40 bg-[#0e0e10] overflow-hidden"
        >
            {/* Ambient Background Glow */}
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
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/5 mb-8 backdrop-blur-xl">
                                    <Play size={16} className="text-orange-400 fill-current" />
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-orange-300">Live Operation</span>
                                </div>

                                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.9] text-slate-100 mb-8 italic">
                                    Witness the <br />
                                    <span className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Operation.</span>
                                </h2>

                                <p className="text-lg text-slate-400 max-w-lg mb-8 leading-relaxed font-light border-l-2 border-slate-800 pl-8">
                                    STROKE isn't a theory. It's a live data processing workbench. Watch the engine decode contextual talent trajectory in real-time.
                                </p>

                                <div className="grid grid-cols-1 gap-6 relative">
                                    {/* Tactile Governance Cards */}
                                    <motion.div
                                        whileHover={{ x: 10, borderColor: 'rgba(59, 130, 246, 0.3)' }}
                                        className="glass-card p-6 flex items-start gap-6 border-white/5 shadow-2xl transition-all duration-300 group cursor-default"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Play size={22} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-wide text-sm mb-2">Live Demo</h4>
                                            <p className="text-slate-500 text-sm leading-snug">Watch the engine decode contextual talent trajectory in real-time.</p>
                                        </div>
                                    </motion.div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                    transition={{ duration: 0.8, delay: 0.8 }}
                                    className="mt-16 flex flex-col md:flex-row gap-6"
                                >
                                    <button
                                        onClick={onCTA}
                                        className="relative z-10 glass-button px-8 py-4 text-lg font-bold tracking-tight text-white flex items-center gap-4 bg-white/5 border-white/20 hover:border-blue-400/50 shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(59,130,246,0.2)]"
                                    >
                                        Launch My Workbench
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <ArrowRight />
                                        </motion.div>
                                    </button>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Right Side: Video Scene (Overlap design) */}
                        <div className="relative z-10 order-1 lg:order-2 h-[400px] lg:h-[600px] flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                                animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.9, rotateY: 20 }}
                                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                className="relative w-full aspect-video rounded-3xl md:rounded-[2.5rem] overflow-hidden glass-card border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.15)] group"
                            >
                                <iframe
                                    className="w-full h-full relative z-0"
                                    src="https://www.youtube.com/embed/cq5UKAv_zsg?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1"
                                    title="STROKE Cinematic Demo"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </motion.div>

                            {/* Magazine detail overlay */}
                            <div className="absolute top-0 right-0 p-8 flex flex-col items-end pointer-events-none opacity-40">
                                <div className="text-[10px] font-mono text-slate-600 tracking-[0.5em] uppercase mb-2">Live.0x3FF</div>
                                <div className="w-16 h-[1px] bg-slate-800" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default CinematicProofSection;
