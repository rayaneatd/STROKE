import React, { useState, useRef } from 'react';
import { motion, useInView, useAnimation, useDragControls } from 'framer-motion';
import { Ghost, Settings } from 'lucide-react';

const AgitationSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [sliderPos, setSliderPos] = useState(50);
    const constraintsRef = useRef(null);

    return (
        <section
            id="agitation"
            ref={ref}
            className="relative min-h-screen w-full flex flex-col items-center justify-center py-32 z-20 bg-[#0e0e10]"
        >
            <div className="container mx-auto px-6 lg:px-12 relative z-10">

                {/* Asymmetrical Intro Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-8 lg:col-start-3"
                    >
                        <span className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block">The invisible attrition</span>
                        <h2 className="text-5xl md:text-8xl font-black mb-10 leading-[0.95] text-slate-100 italic">
                            The Hidden Cost of the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 not-italic">Invisible Top 1%</span>.
                        </h2>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-12 h-[1px] bg-slate-700 mt-4 shrink-0" />
                            <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed max-w-2xl">
                                Legacy ATS systems scan for characters, not context. They miss the trajectory.
                                <span className="text-slate-200"> 68% of elite talent is discarded </span> by algorithms that can't read between the lines.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Tactile Comparison Slider (Asymmetrical placement) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
                        transition={{ delay: 0.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-10 lg:col-start-2 relative"
                    >
                        <div
                            ref={constraintsRef}
                            className="relative w-full aspect-[16/10] md:aspect-[21/9] glass-card rounded-[2rem] overflow-hidden cursor-ew-resize select-none border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] group"
                        >
                            {/* STROKE Content (Right/Base) */}
                            <div className="absolute inset-0 bg-blue-900/5 flex flex-col justify-center px-10 md:px-24">
                                <div className="max-w-xl self-end text-right">
                                    <h3 className="text-3xl font-black text-blue-400 mb-6 uppercase tracking-widest">STROKE Insight</h3>
                                    <ul className="space-y-6">
                                        {[
                                            "Decodes 14-month hyper-growth patterns.",
                                            "Exposes gap manipulation via contextual cross-referencing.",
                                            "Weights 'Velocity' above static job titles."
                                        ].map((text, i) => (
                                            <li key={i} className="text-lg md:text-xl font-mono text-blue-100/90 leading-tight">
                                                {text} <span className="text-blue-500 ml-2">_</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Legacy Content (Left/Clip) */}
                            <motion.div
                                className="absolute inset-0 bg-[#121214] overflow-hidden border-r border-red-500/50"
                                style={{ width: `${sliderPos}%` }}
                            >
                                <div className="absolute inset-0 w-[80vw] flex flex-col justify-center px-10 md:px-24 grayscale">
                                    <div className="max-w-xl">
                                        <h3 className="text-3xl font-black text-red-500/80 mb-6 uppercase tracking-widest">Legacy Logic</h3>
                                        <ul className="space-y-6">
                                            {[
                                                "Keyword density: 42% (Fail).",
                                                "Scanning for exact string matches...",
                                                "Unable to parse non-standard formatting."
                                            ].map((text, i) => (
                                                <li key={i} className="text-lg md:text-xl font-mono text-slate-500 leading-tight">
                                                    {text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Tactile Handle */}
                            <div
                                className="absolute top-0 bottom-0 w-1 -ml-[0.5px] z-30 pointer-events-none"
                                style={{ left: `${sliderPos}%` }}
                            >
                                <div className="h-full w-full bg-gradient-to-b from-transparent via-white/50 to-transparent" />
                                <motion.div
                                    drag="x"
                                    dragConstraints={constraintsRef}
                                    dragElastic={0}
                                    dragMomentum={false}
                                    onDrag={(e, info) => {
                                        if (constraintsRef.current) {
                                            const rect = (constraintsRef.current as HTMLDivElement).getBoundingClientRect();
                                            const x = info.point.x - rect.left;
                                            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                                            setSliderPos(percentage);
                                        }
                                    }}
                                    className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-ew-resize pointer-events-auto group-hover:scale-110 transition-transform"
                                >
                                    <div className="flex gap-1.5">
                                        <div className="w-1 h-6 bg-black rounded-full" />
                                        <div className="w-1 h-6 bg-black rounded-full" />
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Asymmetrical Labeling */}
                        <div className="absolute -bottom-12 left-0 right-0 flex justify-between items-center text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase">
                            <span className="flex items-center gap-4">
                                <Settings size={12} className="animate-spin-slow" /> Binary Parser
                            </span>
                            <span className="flex items-center gap-4 text-blue-400">
                                Contextual Engine <Ghost size={12} className="animate-pulse" />
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AgitationSection;
