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
            className="relative min-h-screen w-full flex flex-col items-center justify-center py-24 z-20 bg-[#0e0e10]"
        >
            <div className="container mx-auto px-6 lg:px-12 relative z-10">

                {/* Asymmetrical Intro Header */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16"
                >
                    <div className="lg:col-span-8 lg:col-start-3">
                        {/* Floating Section Tag */}
                        <motion.span
                            variants={itemVariants}
                            className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block"
                        >
                            The invisible attrition
                        </motion.span>

                        <motion.h2
                            variants={itemVariants}
                            className="text-4xl md:text-7xl font-black mb-8 leading-[0.95] text-slate-100 italic"
                        >
                            The Hidden Cost of the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 not-italic">Invisible Top 1%</span>.
                        </motion.h2>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <motion.div
                                variants={itemVariants}
                                animate={{ height: [1, 5, 1], opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-[2px] h-12 bg-red-500/50 mt-4 shrink-0"
                            />
                            <motion.p
                                variants={itemVariants}
                                className="text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-2xl border-l border-white/5 pl-8"
                            >
                                Legacy ATS systems scan for characters, not context. They miss the trajectory.
                                <span className="text-slate-200 block mt-4 font-bold"> 68% of elite talent is discarded </span> by algorithms that can't read between the lines.
                            </motion.p>
                        </div>
                    </div>
                </motion.div>

                {/* Tactile "Truth Lens" Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
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
                            className="relative w-full aspect-[16/10] md:aspect-[21/7] glass-card rounded-[2rem] overflow-hidden select-none border border-white/10 shadow-[0_60px_120px_rgba(0,0,0,0.7)] group cursor-none"
                        >
                            {/* Base Layer: Legacy Content */}
                            <div className="absolute inset-0 bg-[#0a0a0c] flex flex-col justify-center px-10 md:px-24 grayscale opacity-30">
                                <div className="max-w-xl">
                                    <h3 className="text-3xl font-black text-slate-700 mb-6 uppercase tracking-[0.3em]">Legacy Logic</h3>
                                    <ul className="space-y-4 font-mono text-slate-600 text-sm">
                                        <li>[SYSTEM] Searching for explicit string "React"...</li>
                                        <li>[SYSTEM] Keyword density: 42.1% (FAIL)</li>
                                        <li>[SYSTEM] Formatting status: Unrecognized</li>
                                        <li>[STATUS] Outcome: Automated Rejection</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Revealing Layer: STROKE */}
                            <div
                                className="absolute inset-0 bg-blue-600/5 backdrop-blur-3xl flex flex-col justify-center px-10 md:px-24 pointer-events-none"
                                style={{
                                    clipPath: `circle(150px at ${mousePos.x}% ${mousePos.y}%)`,
                                    WebkitClipPath: `circle(150px at ${mousePos.x}% ${mousePos.y}%)`
                                }}
                            >
                                <div className="max-w-xl">
                                    <h3 className="text-3xl font-black text-blue-400 mb-6 uppercase tracking-[0.3em] shadow-blue-500/20">STROKE Insight</h3>
                                    <ul className="space-y-4 font-mono text-blue-100 italic">
                                        <li className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                            Hyper-growth pattern (1.4x trajectory)
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                            Contextual expertise: Core Infra
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                            Soft skill: Cross-functional architecture
                                        </li>
                                        <li className="flex items-center gap-3 text-blue-400 font-bold not-italic mt-6 bg-blue-500/10 w-fit px-4 py-1 rounded-sm">
                                            MATCH: HIGH POTENTIAL LEAD (0.97)
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Neon Cursor Lens Ring */}
                            <motion.div
                                className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full border border-blue-500/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen shadow-[0_0_60px_rgba(59,130,246,0.3)] flex items-center justify-center"
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
                                <ScanLine className="text-blue-500/40" size={64} />
                                <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl" />
                            </motion.div>

                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 uppercase tracking-[0.5em] opacity-30 group-hover:opacity-60 transition-opacity">
                                drag focus to uncover reality
                            </div>
                        </div>

                        {/* Labels */}
                        <motion.div
                            variants={itemVariants}
                            className="absolute -bottom-16 left-0 right-0 flex justify-between items-center text-[10px] font-mono tracking-[0.3em] text-slate-600 uppercase"
                        >
                            <span className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full">
                                <Settings size={12} className="animate-spin-slow" /> Passive Scanning
                            </span>
                            <span className="flex items-center gap-4 text-blue-400 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
                                Active Contextual Analysis <Ghost size={12} className="animate-pulse" />
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AgitationSection;
