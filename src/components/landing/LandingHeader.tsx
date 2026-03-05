import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
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

    // Expand header background slightly on scroll
    const headerBgOpacity = useTransform(scrollY, [0, 100], [0, 0.4]);
    const headerBorderOpacity = useTransform(scrollY, [0, 100], [0, 0.1]);
    const headerBlur = useTransform(scrollY, [0, 100], [0, 16]);

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-4 flex items-center justify-between transition-all duration-300"
            style={{
                backgroundColor: `rgba(0, 0, 0, ${headerBgOpacity.get()})`,
                borderBottom: `1px solid rgba(255, 255, 255, ${headerBorderOpacity.get()})`,
                backdropFilter: `blur(${headerBlur.get()}px)`,
                WebkitBackdropFilter: `blur(${headerBlur.get()}px)`
            }}
        >
            <motion.div
                animate={{
                    y: [0, -2, 2, 0],
                    rotate: [0, 0.5, -0.5, 0]
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="flex items-center gap-3"
            >
                <Logo variant="full" height={40} />
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
                {isAuthenticated ? (
                    <button
                        onClick={onCTA}
                        className="glass-button flex items-center gap-2 group"
                    >
                        <ShieldCheck size={16} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                        <span className="text-sm font-semibold tracking-wide text-slate-200">Go to Console</span>
                    </button>
                ) : (
                    <button
                        onClick={onCTA}
                        className="relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] flex items-center gap-2 group"
                    >
                        <span className="relative z-10">Get Early Access</span>
                        <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                    </button>
                )}
            </motion.div>
        </motion.header>
    );
};

export default LandingHeader;
