import React, { useState, useRef } from 'react';
import { motion, useInView, useAnimation, useDragControls } from 'framer-motion';
import { Ghost, Settings } from 'lucide-react';

const AgitationSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    // Slider state (0 = fully left/Legacy, 100 = fully right/STROKE)
    const [sliderPos, setSliderPos] = useState(50);
    const constraintsRef = useRef(null);

    return (
        <section ref={ref} className="relative min-h-[90svh] w-full flex flex-col items-center justify-center py-24 z-20">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 bg-[#0e0e10]/80 backdrop-blur-3xl z-0 pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-black mb-6">
                            The Hidden Cost of the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Invisible Top 1%</span>.
                        </h2>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                            Most ATS systems scan formatting and search for buzzwords. They match characters, not context. As a result, 68% of actual top-tier talent is automatically discarded before human review.
                        </p>
                    </motion.div>
                </div>

                {/* Interactive Comparison Slider */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative w-full max-w-5xl mx-auto h-[400px] md:h-[500px] glass-card rounded-3xl overflow-hidden cursor-ew-resize select-none border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    ref={constraintsRef}
                >
                    {/* Background: STROKE (Deep Logic) */}
                    <div className="absolute inset-0 bg-blue-900/10 flex flex-col justify-center pl-8 md:pl-20">
                        <div className="max-w-md">
                            <h3 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200 mb-4 tracking-wide">
                                STROKE Intelligence
                            </h3>
                            <ul className="space-y-4 font-mono text-sm text-blue-100/80">
                                <li className="flex items-start gap-4 neon-glow-primary p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <span className="text-blue-400 mt-1">[✓]</span>
                                    <span>Identifies 14-month retention patterns across high-pressure environments.</span>
                                </li>
                                <li className="flex items-start gap-4 p-3 rounded-lg border border-transparent">
                                    <span className="text-blue-400 mt-1">[✓]</span>
                                    <span>Flags unexplained 6-month gaps hidden via creative date formatting.</span>
                                </li>
                                <li className="flex items-start gap-4 p-3 rounded-lg border border-transparent">
                                    <span className="text-blue-400 mt-1">[✓]</span>
                                    <span>Analyzes "Velocity": promotions over time, not just static titles.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Foreground (Clipping Mask): Legacy ATS */}
                    <div
                        className="absolute inset-0 bg-[#0e0e10] overflow-hidden transition-all duration-75 border-r border-red-500/50 shadow-[5px_0_15px_rgba(239,68,68,0.2)]"
                        style={{ width: `${sliderPos}%` }}
                    >
                        {/* Inner content needs to be fixed width to not shrink with mask */}
                        <div className="absolute inset-0 w-[80vw] max-w-5xl flex flex-col justify-center pl-8 md:pl-20">
                            <div className="max-w-md">
                                <h3 className="text-2xl md:text-3xl font-bold text-red-400/80 mb-4 tracking-tight grayscale">
                                    Legacy ATS
                                </h3>
                                <ul className="space-y-4 font-mono text-sm text-slate-500">
                                    <li className="flex items-start gap-4 p-3 rounded-lg border border-white/5 bg-white/5 opacity-50">
                                        <span className="text-red-500/60 mt-1">[x]</span>
                                        <span>Matched 4 out of 5 keywords on page 2.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-3 rounded-lg border border-white/5 bg-white/5 opacity-50">
                                        <span className="text-red-500/60 mt-1">[x]</span>
                                        <span>Rejected: Template format not recognized by OCR parser.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-3 rounded-lg border border-white/5 bg-white/5 opacity-50">
                                        <span className="text-red-500/60 mt-1">[x]</span>
                                        <span>Accepted: Candidate lied about dates to hide a rapid firing.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Draggable Handle */}
                    <div
                        className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize hover:bg-white/5 transition-colors z-20 group"
                        style={{ left: `${sliderPos}%` }}
                    >
                        <div className="w-1 h-full bg-slate-400/20 group-hover:bg-blue-400/50 transition-colors"></div>
                        <motion.div
                            className="absolute w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600 shadow-xl"
                            drag="x"
                            dragConstraints={constraintsRef}
                            dragElastic={0}
                            dragMomentum={false}
                            onDrag={(e, info) => {
                                // Calculate percentage based on parent width
                                if (constraintsRef.current) {
                                    const rect = (constraintsRef.current as HTMLDivElement).getBoundingClientRect();
                                    const x = info.point.x - rect.left;
                                    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                                    setSliderPos(percentage);
                                }
                            }}
                        >
                            <div className="flex gap-1 group-hover:scale-110 transition-transform text-slate-400">
                                <div className="w-0.5 h-4 bg-current"></div>
                                <div className="w-0.5 h-4 bg-current"></div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex justify-center gap-8 mt-8 text-xs font-mono tracking-widest uppercase"
                >
                    <span className="text-red-400/80 flex items-center gap-2"><Settings size={12} /> Legacy Regex Parser</span>
                    <span className="text-blue-400 flex items-center gap-2"><Ghost size={12} /> STROKE Contextual Trajectory</span>
                </motion.div>
            </div>
        </section>
    );
};

export default AgitationSection;
