import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Radar } from 'lucide-react';
import HeroCanvas from './HeroCanvas';

interface HeroSectionProps {
    onCTA: () => void;
}

const WORDS = ["Keywords", "Buzzwords", "Formatting", "Trajectory"];

const HeroSection: React.FC<HeroSectionProps> = ({ onCTA }) => {
    const [wordIndex, setWordIndex] = useState(0);

    // Swap words for the morphing effect
    useEffect(() => {
        if (wordIndex === WORDS.length - 1) return; // Stop at "Trajectory"

        const timeout = setTimeout(() => {
            setWordIndex((prev) => prev + 1);
        }, 1500);
        return () => clearTimeout(timeout);
    }, [wordIndex]);

    const isFinalWord = wordIndex === WORDS.length - 1;

    return (
        <section className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden pt-20">
            {/* The 3D Canvas Background */}
            <HeroCanvas />

            <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                {/* Asymmetrical Left Block */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="md:col-span-8 md:col-start-2 flex flex-col items-start"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel mb-8 border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <Radar size={14} className="text-blue-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-300">The deep logic engine</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] text-slate-100 mb-6 drop-shadow-2xl">
                        <span className="block opacity-90">Recruiting doesn't</span>
                        <span className="block opacity-90">need more</span>
                        <div className="flex flex-wrap items-baseline gap-4 mt-2 h-20 md:h-28 overflow-hidden relative">
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={wordIndex}
                                    initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        filter: 'blur(0px)',
                                        color: isFinalWord ? '#3b82f6' : '#94a3b8'
                                    }}
                                    exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                                    className={`inline-block ${isFinalWord ? 'neon-text' : ''}`}
                                >
                                    {WORDS[wordIndex]}.
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </h1>

                    {/* Morphing Subtitle based on word state */}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={isFinalWord ? 'final' : 'intro'}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5 }}
                            className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mb-12 border-l-4 border-blue-500/50 pl-6 py-2"
                        >
                            {isFinalWord
                                ? "STROKE analyzes career patterns, anomalies, and velocity over time. It sees what legacy ATS systems are completely blind to."
                                : "While legacy ATS systems blindly match flat data, you're missing the invisible top 1% of talent."}
                        </motion.p>
                    </AnimatePresence>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="flex flex-col sm:flex-row items-center gap-6"
                    >
                        <button
                            onClick={onCTA}
                            className="w-full sm:w-auto neon-glow-primary bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-lg py-4 px-10 rounded-full transition-all duration-300 flex items-center justify-center gap-3 group backdrop-blur-md relative overflow-hidden"
                        >
                            <span className="relative z-10">Start Free Scan</span>
                            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            {/* Glass reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                        </button>
                    </motion.div>
                </motion.div>

                {/* Right asymmetrical anchor */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="hidden md:flex md:col-span-3 items-end justify-end h-full pb-32"
                >
                    <div className="flex flex-col gap-4 text-right">
                        <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">System Status</span>
                        <div className="flex justify-end gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-1.5 h-8 bg-blue-500/20 rounded-full overflow-hidden">
                                    <div
                                        className="w-full bg-blue-500 glow-blue-500 transition-all duration-1000"
                                        style={{ height: `${Math.random() * 100}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Scroll to Discover</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-blue-500/50 to-transparent"></div>
            </motion.div>
        </section>
    );
};

export default HeroSection;
