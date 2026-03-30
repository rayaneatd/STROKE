import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Ghost, Settings, ScanLine } from 'lucide-react';

const AgitationSection: React.FC = () => {
    const ref = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, scaleY: 0.8, rotateX: -15 },
        visible: {
            opacity: 1,
            scaleY: 1,
            rotateX: 0,
            transition: {
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 40, filter: 'blur(15px)', skewX: -5 },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            skewX: 0,
            transition: { duration: 1, ease: "easeOut" }
        }
    };

    // Auto-drift if no mouse interaction
    useEffect(() => {
        if (isHovering) return;

        let angle = 0;
        const interval = setInterval(() => {
            angle += 0.02;
            setMousePos({
                x: 50 + Math.cos(angle) * 30,
                y: 50 + Math.sin(angle) * 20
            });
        }, 16);
        return () => clearInterval(interval);
    }, [isHovering]);

    return (
        <section
            id="agitation"
            ref={ref}
            className="relative min-h-[80vh] w-full flex flex-col items-center justify-center py-12 z-20 bg-[#0e0e10]"
        >
            <div className="container mx-auto px-4 lg:px-8 relative z-10">

                {/* Asymmetrical Intro Header */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8"
                >
                    <div className="lg:col-span-8 lg:col-start-3">
                        {/* Floating Section Tag */}
                        <motion.span
                            variants={itemVariants}
                            className="text-blue-500 font-mono text-[9px] tracking-[0.6em] uppercase mb-2.5 block"
                        >
                            The cost of inefficiency
                        </motion.span>

                        <motion.h2
                            variants={itemVariants}
                            className="text-2xl md:text-4xl font-black mb-5 leading-[1] text-slate-100 italic"
                        >
                            Stop missing out on the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-300 not-italic">Top 1% of talent.</span>
                        </motion.h2>

                        <div className="flex flex-col md:flex-row gap-5 items-start">
                            <motion.div
                                variants={itemVariants}
                                animate={{ height: [1, 5, 1], opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-[1.5px] h-8 bg-blue-500/50 mt-2.5 shrink-0"
                            />
                            <motion.p
                                variants={itemVariants}
                                className="text-sm md:text-base text-slate-400 font-light leading-relaxed max-w-lg border-l border-white/5 pl-5"
                            >
                                Legacy systems scan for keywords, not skills. They ignore context and progression.
                                <span className="text-slate-200 block mt-2.5 font-bold"> Over 60% of qualified profiles </span> are discarded by obsolete algorithms that can't read between the lines.
                            </motion.p>
                        </div>
                    </div>
                </motion.div>

                {/* Tactile "Truth Lens" Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7, rotateZ: 5, filter: 'blur(30px)' }}
                        whileInView={{ opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)' }}
                        viewport={{ once: false, amount: 0.1 }}
                        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-10 lg:col-start-2 relative"
                    >
                        <div
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                            className="relative w-full aspect-[21/8] glass-card rounded-[1.25rem] overflow-hidden select-none border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] group"
                        >
                            {/* Base Layer: Legacy Content */}
                            <div className="absolute inset-0 bg-[#0a0a0c] flex flex-col justify-center px-6 md:px-12 grayscale opacity-30">
                                <div className="max-w-md text-left">
                                    <h3 className="text-xl font-black text-slate-700 mb-3 uppercase tracking-[0.3em]">Legacy Methods</h3>
                                    <ul className="space-y-2.5 font-mono text-slate-600 text-[11px]">
                                        <li>[PROCESS] Manual Filtering: ~10 min / resume</li>
                                        <li>[SILOS] No real-time collaboration</li>
                                        <li>[GHOSTING] High candidate dropout rate</li>
                                        <li>[STATUS] Outcome: Latency and talent loss</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Revealing Layer: STROKE */}
                            <div
                                className="absolute inset-0 bg-blue-600/5 backdrop-blur-3xl flex flex-col justify-center px-6 md:px-12 pointer-events-none"
                                style={{
                                    clipPath: `circle(100px at ${mousePos.x}% ${mousePos.y}%)`,
                                    WebkitClipPath: `circle(100px at ${mousePos.x}% ${mousePos.y}%)`
                                }}
                            >
                                <div className="max-w-md text-left">
                                    <h3 className="text-xl font-black text-blue-400 mb-3 uppercase tracking-[0.3em] shadow-blue-500/20">The STROKE Experience</h3>
                                    <ul className="space-y-2.5 font-mono text-blue-100 text-[13px] italic">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                            Smart Ranking: Instant Evaluation
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                            Anti-Ghosting: Automated Engagement
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                            Collaborative Workspace: Team Synchronization
                                        </li>
                                        <li className="flex items-center gap-2 text-blue-400 font-bold not-italic mt-3.5 bg-blue-500/10 w-fit px-2.5 py-1 rounded-sm text-[11px]">
                                            STATUS: 12x FASTER / SMARTER / LIGHTER
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Neon Cursor Lens Ring */}
                            <motion.div
                                className="absolute top-0 left-0 w-[200px] h-[200px] rounded-full border border-blue-500/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center"
                                animate={{
                                    left: `${mousePos.x}%`,
                                    top: `${mousePos.y}%`,
                                    rotate: [0, 360]
                                }}
                                transition={{
                                    left: { type: "tween", ease: "linear", duration: 0.1 },
                                    top: { type: "tween", ease: "linear", duration: 0.1 },
                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                                }}
                            >
                                <ScanLine className="text-blue-500/40" size={40} />
                                <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-2xl" />
                            </motion.div>

                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500 uppercase tracking-[0.5em] opacity-30 group-hover:opacity-60 transition-opacity">
                                Hover to reveal reality
                            </div>
                        </div>

                        {/* Labels */}
                        <motion.div
                            variants={itemVariants}
                            className="absolute -bottom-12 left-0 right-0 flex justify-between items-center text-[9px] font-mono tracking-[0.3em] text-slate-600 uppercase"
                        >
                            <span className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full">
                                <Settings size={10} className="animate-spin-slow" /> Classic Analysis
                            </span>
                            <span className="flex items-center gap-3 text-blue-400 bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/10">
                                Active Contextual Analysis <Ghost size={10} className="animate-pulse" />
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AgitationSection;
