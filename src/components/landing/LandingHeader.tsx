import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';

interface LandingHeaderProps {
    onCTA: () => void;
    isAuthenticated: boolean;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ onCTA, isAuthenticated }) => {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const updateScrolled = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', updateScrolled);
        updateScrolled();
        return () => window.removeEventListener('scroll', updateScrolled);
    }, []);

    const headerBgOpacity = useTransform(scrollY, [0, 100], [0, 0.3]);
    const headerBlur = useTransform(scrollY, [0, 100], [0, 12]);
    const headerBorderOpacity = useTransform(scrollY, [0, 100], [0, 0.05]);
    const logoScale = useTransform(scrollY, [0, 200], [1, 0.85]);

    // Compose MotionValues into CSS strings – Framer Motion handles live updates
    const bgColor = useTransform(headerBgOpacity, (v) => `rgba(10, 10, 12, ${v})`);
    const borderColor = useTransform(headerBorderOpacity, (v) => `1px solid rgba(255, 255, 255, ${v})`);
    const blur = useTransform(headerBlur, (v) => `blur(${v}px)`);

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-2 flex items-center justify-between"
            style={{
                backgroundColor: bgColor,
                borderBottom: borderColor,
                backdropFilter: blur,
                WebkitBackdropFilter: blur,
            }}
        >
            <motion.div
                style={{ scale: logoScale }}
                animate={{
                    y: [0, -1, 1, 0],
                    rotate: [0, 0.2, -0.2, 0]
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="flex items-center gap-2.5 origin-left"
            >
                <Logo variant="full" height={44} glow={false} />
            </motion.div>


            <motion.div
                animate={{
                    y: [0, 2, -2, 0]
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="flex items-center gap-5"
            >
                <AnimatePresence mode="wait">
                    {isAuthenticated ? (
                        <motion.button
                            key="console"
                            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            onClick={onCTA}
                            className="glass-button flex items-center gap-2 group px-4 py-2 rounded-full border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors shadow-lg"
                        >
                            <ShieldCheck size={14} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                            <span className="text-[11px] font-black tracking-widest uppercase text-slate-200">Browse App</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            key="access"
                            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            onClick={onCTA}
                            className="relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-tighter py-2 px-6 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/50 transition-all duration-300 hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] flex items-center gap-2.5 group"
                        >
                            <span className="relative z-10 text-[11px]">Get Early Access</span>
                            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] skew-x-[-20deg]"
                                animate={{ translateX: ['-150%', '300%'] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 1 }}
                            />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.header>
    );
};

export default LandingHeader;
