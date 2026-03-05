import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ghost, Settings, ScanLine } from 'lucide-react';

const AgitationSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? {
                            opacity: 1,
                            y: 0,
                        } : { opacity: 0, y: 30 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-8 lg:col-start-3"
                    >
                        {/* Floating Section Tag */}
                        <motion.span
                            animate={{
                                x: [0, 5, -5, 0],
                                rotate: [0, 2, -2, 0]
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block"
                        >
                            The invisible attrition
                        </motion.span>

                        <motion.h2
                            animate={{
                                skewX: [0, 1, -1, 0],
                                y: [0, -5, 0]
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="text-4xl md:text-7xl font-black mb-8 leading-[0.95] text-slate-100 italic"
                        >
                            The Hidden Cost of the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 not-italic">Invisible Top 1%</span>.
                        </motion.h2>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <motion.div
                                animate={{ height: [1, 2, 1], opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-12 h-[1px] bg-slate-700 mt-4 shrink-0"
                            />
                            <motion.p
                                animate={{ x: [0, 2, -2, 0] }}
                                transition={{ duration: 15, repeat: Infinity }}
                                className="text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-2xl"
                            >
                                Legacy ATS systems scan for characters, not context. They miss the trajectory.
                                <span className="text-slate-200"> 68% of elite talent is discarded </span> by algorithms that can't read between the lines.
                            </motion.p>
                        </div>
                    </motion.div>
                </div>

                {/* Tactile "Truth Lens" Comparison (Replacing buggy slider) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
                        transition={{ delay: 0.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-10 lg:col-start-2 relative"
                    >
                        <div
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                            className="relative w-full aspect-[16/10] md:aspect-[21/7] glass-card rounded-[1.5rem] overflow-hidden select-none border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] group cursor-none"
                        >
                            {/* Base Layer: Legacy Content (Grayscale / Boring) */}
                            <div className="absolute inset-0 bg-[#121214] flex flex-col justify-center px-10 md:px-24 grayscale opacity-40">
                                <div className="max-w-xl">
                                    <h3 className="text-3xl font-black text-slate-600 mb-6 uppercase tracking-[0.2em]">Legacy Logic</h3>
                                    <ul className="space-y-4 font-mono text-slate-500">
                                        <li>Searching for explicit string "React"...</li>
                                        <li>Keyword density: 42.1%</li>
                                        <li>Formatting status: Unrecognized</li>
                                        <li>Outcome: Automated Rejection</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Revealing Layer: STROKE (Full Color / Contextual) */}
                            <div
                                className="absolute inset-0 bg-blue-900/10 backdrop-blur-3xl flex flex-col justify-center px-10 md:px-24 pointer-events-none"
                                style={{
                                    clipPath: `circle(150px at ${mousePos.x}% ${mousePos.y}%)`,
                                    WebkitClipPath: `circle(150px at ${mousePos.x}% ${mousePos.y}%)`
                                }}
                            >
                                <div className="max-w-xl">
                                    <h3 className="text-3xl font-black text-blue-400 mb-6 uppercase tracking-[0.2em] neon-text">STROKE Insight</h3>
                                    <ul className="space-y-4 font-mono text-blue-100">
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            Hyper-growth pattern detected (1.4x trajectory)
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            Contextual expertise: Core Infrastructure
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            Soft skill: Cross-functional architecture
                                        </li>
                                        <li className="flex items-center gap-3 text-blue-400 font-bold">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            Match: High Potential Lead
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Neon Cursor Lens Ring */}
                            <motion.div
                                className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full border-2 border-blue-500/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen shadow-[0_0_50px_rgba(59,130,246,0.3)] flex items-center justify-center"
                                animate={{
                                    left: `${mousePos.x}%`,
                                    top: `${mousePos.y}%`,
                                    rotate: [0, 360]
                                }}
                                transition={{
                                    left: { type: "tween", ease: "linear", duration: 0.1 },
                                    top: { type: "tween", ease: "linear", duration: 0.1 },
                                    rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                                }}
                            >
                                <ScanLine className="text-blue-400 opacity-50" size={48} />
                                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl" />
                            </motion.div>

                            <div className="absolute bottom-6 right-8 text-[9px] font-mono text-slate-500 uppercase tracking-[0.4em] opacity-40">
                                Move lens to expose truth
                            </div>
                        </div>

                        {/* Asymmetrical Labeling */}
                        <div className="absolute -bottom-12 left-0 right-0 flex justify-between items-center text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase">
                            <span className="flex items-center gap-4">
                                <Settings size={12} className="animate-spin-slow" /> Passive Scanning
                            </span>
                            <span className="flex items-center gap-4 text-blue-400">
                                Active Contextual Analysis <Ghost size={12} className="animate-pulse" />
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AgitationSection;
