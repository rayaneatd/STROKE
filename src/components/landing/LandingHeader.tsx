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
    const logoScale = useTransform(scrollY, [0, 200], [1, 0.7]);

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-3 flex items-center justify-between transition-all duration-300"
            style={{
                backgroundColor: `rgba(10, 10, 12, ${headerBgOpacity.get()})`,
                borderBottom: `1px solid rgba(255, 255, 255, ${headerBorderOpacity.get()})`,
                backdropFilter: `blur(${headerBlur.get()}px)`,
                WebkitBackdropFilter: `blur(${headerBlur.get()}px)`,
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
                className="flex items-center gap-3 origin-left"
            >
                <Logo variant="full" height={80} />
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
                className="flex items-center gap-6"
            >
                <AnimatePresence mode="wait">
                    {isAuthenticated ? (
                        <motion.button
                            key="console"
                            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            onClick={onCTA}
                            className="glass-button flex items-center gap-2 group px-6 py-3 rounded-full border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors shadow-lg"
                        >
                            <ShieldCheck size={16} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                            <span className="text-sm font-black tracking-widest uppercase text-slate-200">Console</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            key="access"
                            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            onClick={onCTA}
                            className="relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-tighter py-3 px-10 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/50 transition-all duration-300 hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] flex items-center gap-3 group"
                        >
                            <span className="relative z-10 text-sm">Join the Elite</span>
                            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
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
