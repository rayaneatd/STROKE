import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import HeroCanvas from './HeroCanvas';

interface HeroSectionProps {
    onCTA: () => void;
}

const WORDS = ["Keywords", "Buzzwords", "Formatting", "Trajectory"];

const HeroSection: React.FC<HeroSectionProps> = ({ onCTA }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "-100px" });

    useEffect(() => {
        const timeout = setTimeout(() => {
            setWordIndex((prev) => (prev + 1) % WORDS.length);
        }, 2000);
        return () => clearTimeout(timeout);
    }, [wordIndex]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const floatVariants: Variants = {
        hidden: { opacity: 0, y: 60, scale: 0.9, rotateX: 15 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            transition: {
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    const sideEntryVariants: Variants = {
        hidden: { opacity: 0, x: -100, skewX: -10, filter: 'blur(10px)' },
        visible: {
            opacity: 1,
            x: 0,
            skewX: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    const punchlineVariants: Variants = {
        hidden: { opacity: 0, filter: 'blur(20px)', y: 40, scale: 0.8 },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            scale: 1,
            transition: {
                duration: 1,
                ease: [0.34, 1.56, 0.64, 1] // Organic bounce
            }
        }
    };

    return (
        <section
            id="hero"
            ref={ref}
            aria-label="Introduction"
            className="relative min-h-screen w-full flex items-center justify-start overflow-hidden pt-16 bg-[#0e0e10]"
        >
            {/* Ambient Lighting for Depth */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[120px] rounded-full" />
            </div>

            <HeroCanvas />

            <motion.div
                className="container mx-auto px-6 lg:px-12 relative z-10 w-full text-center lg:text-left"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 items-center">

                    {/* Asymmetrical Heading Block */}
                    <div className="lg:col-span-11 lg:col-start-2 xl:col-span-10 xl:col-start-2">
                        <div className="relative">
                            {/* Decorative Magazine Vertical Tag */}
                            <motion.div
                                variants={floatVariants}
                                className="absolute -left-12 lg:-left-20 top-0 hidden lg:block h-full"
                            >
                                <div className="sticky top-40 flex flex-col items-center gap-6">
                                    <div className="w-[1px] h-20 bg-gradient-to-t from-blue-500/50 to-transparent" />
                                    <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-mono tracking-[0.4em] uppercase text-slate-500 whitespace-nowrap">
                                        Issue v.2.1 — Trajectory Analysis
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={floatVariants}
                                className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel mb-8 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
                                whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.4)' }}
                            >
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-300">
                                    Live Contextual Scanning
                                </span>
                            </motion.div>

                            <motion.h1
                                variants={sideEntryVariants}
                                className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.85] text-slate-100 mb-6 select-none"
                            >
                                <span className="block mb-2">Beyond</span>
                                <span className="relative inline-block mt-4">
                                    Simple
                                    {/* Overlapping Glass accent */}
                                    <motion.div
                                        animate={{
                                            y: [-10, 10, -10],
                                            x: [-10, 10, -10],
                                            rotate: [12, 5, 12]
                                        }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="absolute -right-8 -top-8 w-16 h-16 md:w-32 md:h-32 rounded-2xl glass-panel border border-white/20 -z-10 backdrop-blur-sm shadow-2xl"
                                    />
                                </span>
                                <br />
                                <div className="h-[1.2em] relative flex items-baseline justify-center lg:justify-start overflow-hidden">
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={wordIndex}
                                            initial={{ opacity: 0, y: 100, rotateX: -90, filter: 'blur(10px)' }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                rotateX: 0,
                                                filter: 'blur(0px)',
                                                color: wordIndex === WORDS.length - 1 ? '#3b82f6' : '#94a3b8'
                                            }}
                                            exit={{ opacity: 0, y: -100, rotateX: 90, filter: 'blur(10px)' }}
                                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                            className={`inline-block origin-bottom ${wordIndex === WORDS.length - 1 ? 'neon-text' : ''}`}
                                            aria-live="polite"
                                        >
                                            {WORDS[wordIndex].toLowerCase()}.
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </motion.h1>

                            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 lg:gap-16 mt-12">
                                <motion.div
                                    variants={punchlineVariants}
                                    className="flex flex-col"
                                >
                                    <p className="text-4xl md:text-6xl text-slate-100 font-black leading-[0.9] uppercase mb-2 tracking-tighter italic">
                                        F**k the ATS
                                    </p>
                                    <p className="text-xl md:text-2xl text-blue-400 font-mono tracking-widest lowercase bg-blue-500/10 px-4 py-1 rounded inline-block">
                                        Use STROKE instead
                                    </p>
                                </motion.div>

                                <motion.div
                                    variants={floatVariants}
                                    className="relative group shrink-0"
                                >
                                    <button
                                        onClick={onCTA}
                                        aria-label="Start Free Scan"
                                        className="relative z-10 glass-button px-10 py-5 text-lg font-bold tracking-tight text-white flex items-center gap-4 bg-white/5 border-white/20 hover:border-blue-400/50 shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(59,130,246,0.2)] overflow-hidden rounded-full"
                                    >
                                        <span className="relative z-10">Start Free Scan</span>
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="relative z-10"
                                        >
                                            <ArrowRight />
                                        </motion.div>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40 translate-x-[-100%]"
                                            whileHover={{ translateX: '100%' }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </button>

                                    {/* Tactile Glow */}
                                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Drifting Floating Cards */}
                    <div className="hidden lg:block lg:col-span-12 absolute bottom-20 right-20 pointer-events-none">
                        <motion.div
                            variants={floatVariants}
                            className="flex flex-col gap-6 items-end"
                        >
                            <div className="glass-card p-6 border-white/20 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                                <div className="relative z-10">
                                    <div className="text-[10px] font-mono text-blue-400 mb-3 uppercase tracking-tighter">Velocity Matrix.0x1</div>
                                    <div className="flex gap-1.5 h-12 items-end">
                                        {[0.4, 0.9, 0.6, 1.2, 1.5, 0.8, 1.1].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-3 bg-blue-500/40 rounded-sm"
                                                animate={{
                                                    height: [`${h * 20}%`, `${h * 60}%`, `${h * 20}%`],
                                                    opacity: [0.3, 0.8, 0.3]
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 3 + (i * 0.5),
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </motion.div>

            {/* Continuous Scroll Motion Indicator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 group"
            >
                <span className="text-[9px] font-mono tracking-[0.5em] text-slate-600 uppercase group-hover:text-blue-400 transition-colors">Descending</span>
                <div className="relative h-16 w-[1px] bg-white/10 overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 w-full h-1/2 bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                        animate={{ y: [0, 64, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                </div>
            </motion.div>
        </section>
    );
};

export default HeroSection;
