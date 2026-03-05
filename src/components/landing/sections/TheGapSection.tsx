import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ScanSearch } from 'lucide-react';
import TruthLensCanvas from './TruthLensCanvas';

const TheGapSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative min-h-[100svh] w-full py-24 z-30">
            {/* Subtle Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e10] via-blue-900/10 to-[#0e0e10] z-0"></div>

            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">

                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl mx-auto mb-16"
                >
                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full glass-panel mb-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] mx-auto">
                        <ScanSearch size={14} className="text-blue-400" />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-300">Intelligent Extraction</span>
                    </div>

                    <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                        See past the PDF.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Read the Matrix.</span>
                    </h2>

                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Hover over the document below. While humans see a well-formatted resume, STROKE extracts the underlying JSON data graph, instantly highlighting temporal gaps and pattern anomalies.
                    </p>
                </motion.div>

                {/* Interactive 3D / 2D composite area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="w-full max-w-5xl relative mx-auto rounded-3xl overflow-hidden glass-card border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
                >
                    {/* The "Flat CV" Background Graphic */}
                    <div className="absolute inset-0 z-0 bg-slate-100 flex flex-col p-12 opacity-10 grayscale blur-[2px]">
                        <div className="w-1/3 h-8 bg-slate-300 rounded mb-8"></div>
                        <div className="w-full h-px bg-slate-300 mb-8"></div>
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-8">
                                    <div className="w-1/4 h-4 bg-slate-300 rounded"></div>
                                    <div className="w-3/4 space-y-3">
                                        <div className="w-full h-4 bg-slate-300 rounded"></div>
                                        <div className="w-5/6 h-4 bg-slate-300 rounded"></div>
                                        <div className="w-4/6 h-4 bg-slate-300 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dark overlay to make the neon pop */}
                    <div className="absolute inset-0 z-10 bg-[#0e0e10]/60 mix-blend-multiply"></div>

                    {/* The 3D Lens Canvas */}
                    <TruthLensCanvas />

                    <div className="absolute bottom-6 left-6 right-6 z-30 flex justify-between items-end pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-red-500/30 font-mono text-xs text-red-400">
                            Anomaly Detected: Disguised 6mo gap (2023)
                        </div>
                        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/30 font-mono text-xs text-blue-400">
                            Deep Logic Engine: Active
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default TheGapSection;
