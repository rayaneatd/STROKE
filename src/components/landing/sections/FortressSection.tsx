import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { ShieldCheck, Server, Lock, Cpu, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const FortressSection: React.FC = () => {
    const ref = useRef(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 50, skewY: 2 },
        visible: {
            opacity: 1,
            y: 0,
            skewY: 0,
            transition: {
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30, x: 20, filter: 'blur(12px)', scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            filter: 'blur(0px)',
            scale: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const cardVariants: Variants = {
        hidden: { opacity: 0, scale: 0.8, rotate: -5, filter: 'blur(10px)' },
        visible: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            filter: 'blur(0px)',
            transition: { duration: 0.8, ease: "backOut" }
        }
    };

    return (
        <section
            id="fortress"
            ref={ref}
            className="relative min-h-[85vh] w-full py-12 overflow-hidden bg-[#050505]"
        >
            {/* Ambient Background Glow matching the scene */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* Left Side: Text and Cards */}
                    <div className="lg:col-span-11 xl:col-span-10 lg:col-start-2 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

                        {/* Text Content Block */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                            className="relative z-20 order-2 lg:order-1 lg:pr-6"
                        >
                            <motion.div variants={itemVariants}>
                                <motion.div
                                    animate={{
                                        opacity: [0.4, 1, 0.4],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 mb-5 backdrop-blur-xl shadow-[0_4px_20px_rgba(59,130,246,0.15)]"
                                >
                                    <ShieldCheck size={14} className="text-blue-400 animate-pulse" />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-blue-300">Responsible Intelligence</span>
                                </motion.div>

                                <motion.h2
                                    variants={itemVariants}
                                    className="text-2xl md:text-4xl font-black tracking-tight leading-[1] text-slate-100 mb-5 italic select-none"
                                >
                                    A Transparent <br />
                                    <span className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AI.</span>
                                </motion.h2>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-sm text-slate-400 max-w-md mb-5 leading-relaxed font-light border-l-2 border-slate-800 pl-5"
                                >
                                    Trust isn't declared, it's proven. STROKE is designed to meet the strictest requirements of the <span className="text-slate-200 font-bold">EU AI Act</span> and GDPR. 
                                    <span className="block mt-2.5 text-blue-400/80 font-mono text-[9px] uppercase tracking-widest">
                                        Works alongside your ATS • No IT integration required
                                    </span>
                                </motion.p>

                                <motion.div variants={itemVariants} className="flex flex-col gap-2.5 pl-5 mb-8">
                                    <Link
                                        to="/transparency"
                                        className="flex items-center gap-2.5 text-blue-400 font-mono text-[8px] tracking-[0.3em] uppercase hover:text-blue-300 transition-colors group"
                                    >
                                        [ Consult Transparency Register ]
                                        <div className="h-[1px] w-0 bg-blue-400 group-hover:w-5 transition-all duration-300"></div>
                                    </Link>
                                    <Link
                                        to="/privacy-policy"
                                        className="flex items-center gap-2.5 text-slate-500 font-mono text-[8px] tracking-[0.3em] uppercase hover:text-blue-300 transition-colors group"
                                    >
                                        [ Privacy Policy ]
                                        <div className="h-[1px] w-0 bg-slate-500 group-hover:w-5 transition-all duration-300"></div>
                                    </Link>
                                </motion.div>

                                <div className="grid grid-cols-1 gap-3 relative">
                                    {/* Governance Card 1 */}
                                    <motion.div
                                        variants={cardVariants}
                                        whileHover={{ x: 8, borderColor: 'rgba(59, 130, 246, 0.4)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                                        className="p-4 flex items-start gap-4 border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-xl shadow-2xl transition-all duration-300 group cursor-default"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                                            <Server size={18} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-wide text-[11px] mb-1">Sovereign Hosting</h4>
                                            <p className="text-slate-500 text-[12px] leading-snug">Data residency locked in Ireland (europe-west1). Zero data egress from the European Union.</p>
                                        </div>
                                    </motion.div>

                                    {/* Governance Card 2 */}
                                    <motion.div
                                        variants={cardVariants}
                                        whileHover={{ x: 8, borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                                        className="p-4 flex items-start gap-4 border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-xl shadow-2xl transition-all duration-300 group cursor-default"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                                            <Lock size={18} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-100 font-bold font-mono tracking-wide text-[11px] mb-1">GDPR-Native</h4>
                                            <p className="text-slate-500 text-[12px] leading-snug">Automated PII anonymization. Your data is never used to train public models.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right Side: LUXURY PRO CSS 2D ANIMATION (Replaces 3D) */}
                        <div className="relative z-10 order-1 lg:order-2 h-[250px] lg:h-[400px] flex items-center justify-center pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, rotateY: 30, filter: 'blur(20px)' }}
                                whileInView={{ opacity: 1, scale: 1, rotateY: 0, filter: 'blur(0px)' }}
                                viewport={{ once: false, amount: 0.3 }}
                                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                className="relative w-full max-w-sm aspect-square flex items-center justify-center"
                            >
                                {/* Concentric Security Grid Rings */}
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)] }}
                                        transition={{ duration: 30 + (i * 10), repeat: Infinity, ease: "linear" }}
                                        className="absolute rounded-full border border-dashed border-blue-500/20"
                                        style={{
                                            width: `${(i + 1) * 30}%`,
                                            height: `${(i + 1) * 30}%`,
                                            borderWidth: i === 2 ? '1px' : '2px',
                                        }}
                                    />
                                ))}

                                {/* Core Floating Processor Element */}
                                <motion.div
                                    animate={{ y: [-10, 10, -10], rotateZ: [-2, 2, -2] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute w-28 h-40 bg-gradient-to-b from-blue-900/40 to-[#050505] border border-blue-500/30 rounded-2xl backdrop-blur-3xl shadow-[0_0_60px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center gap-2.5 overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
                                    <ShieldCheck size={36} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                                    <div className="text-[8px] font-mono text-blue-300/80 tracking-widest uppercase">Secured Hub</div>

                                    {/* Scanning Line inside Core */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 w-full h-[2px] bg-blue-400/50 shadow-[0_0_10px_#3b82f6] blur-[1px]"
                                    />
                                </motion.div>

                                {/* Orbiting Data Nodes */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-[80%] h-[80%] rounded-full opacity-50"
                                >
                                    <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 bg-blue-500/10 p-1.5 rounded-full border border-blue-500/30 backdrop-blur-md">
                                        <Database size={14} className="text-blue-400" />
                                    </div>
                                    <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 bg-blue-500/10 p-1.5 rounded-full border border-blue-500/30 backdrop-blur-md">
                                        <Cpu size={14} className="text-blue-400" />
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Detail overlay */}
                            <motion.div
                                variants={itemVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: false }}
                                className="absolute top-0 right-0 p-6 flex flex-col items-end opacity-40 mix-blend-screen"
                            >
                                <div className="text-[9px] font-mono text-slate-500 tracking-[0.5em] uppercase mb-1">Structure.0x1FF</div>
                                <div className="w-12 h-[1px] bg-slate-700" />
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default FortressSection;
