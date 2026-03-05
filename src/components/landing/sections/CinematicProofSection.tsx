import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Play } from 'lucide-react';

interface CinematicProofSectionProps {
    onCTA: () => void;
}

const CinematicProofSection: React.FC<CinematicProofSectionProps> = ({ onCTA }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="relative w-full py-32 z-40 bg-[#0e0e10]">
            <div className="container mx-auto px-6 max-w-6xl">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 mb-6">
                        <Play size={14} className="text-orange-400 fill-current" />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-300">Live Operation</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-100">
                        Witness the Engine.
                    </h2>
                </motion.div>

                {/* The Floating Cinematic Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 40 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative w-full aspect-video rounded-3xl md:rounded-[2.5rem] overflow-hidden glass-card border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.15)] group"
                >
                    {/* Floating elements inside the glass before video plays (Optional overlay UX) */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10"></div>

                    <iframe
                        className="w-full h-full relative z-0"
                        src="https://www.youtube.com/embed/cq5UKAv_zsg?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1"
                        title="STROKE Cinematic Demo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </motion.div>

                {/* Final Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex justify-center mt-24"
                >
                    <button
                        onClick={onCTA}
                        className="neon-glow-primary bg-[#0e0e10] text-blue-400 border border-blue-500 font-bold text-lg py-4 px-12 rounded-full transition-all duration-300 hover:bg-blue-600 hover:text-white flex items-center justify-center gap-3"
                    >
                        Launch My Workbench
                    </button>
                </motion.div>

            </div>
        </section>
    );
};

export default CinematicProofSection;
