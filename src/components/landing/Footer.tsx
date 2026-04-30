import React, { useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const Footer: React.FC = () => {
    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 100 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(10px)', skewY: 2 },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            skewY: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <footer className="w-full border-t border-white/5 bg-[#0a0a0c] pt-20 pb-8 relative z-50 overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-start"
                >
                    {/* Brand / Logo Spread */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-5 xl:col-span-4"
                    >
                        <Logo variant="full" height={56} glow={false} />

                        <motion.div
                            animate={{
                                skewX: [0, 1, -1, 0],
                                rotate: [0, 0.5, -0.5, 0]
                            }}
                            transition={{
                                duration: 15,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="mt-6"
                        >
                            <p className="text-slate-100 text-2xl font-black leading-[1] uppercase tracking-tighter max-w-sm italic">
                                Hiring is Vision. <br />
                                <span className="text-blue-500/80 font-mono tracking-widest text-base lowercase block mt-2 not-italic bg-blue-500/5 px-3 py-1 rounded-sm border border-blue-500/10">results over keywords.</span>
                            </p>
                        </motion.div>

                        {/* Issue Tag detail */}
                        <motion.div
                            variants={itemVariants}
                            animate={{
                                x: [0, 5, 0]
                            }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="mt-8 flex items-center gap-5"
                        >
                            <div className="w-[1px] h-10 bg-slate-800" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-mono tracking-[0.4em] text-slate-600 uppercase">Issue v.2.1</span>
                                <span className="text-[9px] font-mono tracking-[0.4em] text-blue-500/50 uppercase">Mar 2026 Archive</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Navigation Clusters */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 lg:col-start-7"
                    >
                        <h4 className="text-white font-bold mb-6 font-mono tracking-[0.3em] text-[9px] uppercase opacity-40">The Platform</h4>
                        <ul className="space-y-5 text-sm text-slate-400 font-medium">
                            {[
                                { name: 'How it works', path: '#' }, // /deep-logic
                                { name: 'Pricing & Plans', path: '#' } // /pricing
                            ].map((item) => (
                                <motion.li key={item.name} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                    <Link to={item.path} className="hover:text-blue-400 transition-all border-b border-transparent hover:border-blue-400/30 pb-0.5 inline-block">{item.name}</Link>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2"
                    >
                        <h4 className="text-white font-bold mb-6 font-mono tracking-[0.3em] text-[9px] uppercase opacity-40">Governance</h4>
                        <ul className="space-y-5 text-sm text-slate-400 font-medium">
                            {[
                                { name: 'Security Whitepaper', path: '#' }, // /security
                                { name: 'GDPR & Data Residency', path: '/privacy-policy' },
                                { name: 'Refund Policy', path: '/refund-policy' },
                                { name: 'Transparency', path: '/transparency' }
                            ].map((item) => (
                                <motion.li key={item.name} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                    <Link to={item.path} className="hover:text-blue-400 transition-all border-b border-transparent hover:border-blue-400/30 pb-0.5 inline-block">{item.name}</Link>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2"
                    >
                        <h4 className="text-white font-bold mb-6 font-mono tracking-[0.3em] text-[9px] uppercase opacity-40">Resources</h4>
                        <ul className="space-y-5 text-sm text-slate-400 font-medium">
                            {[
                                { name: 'The Manifesto', path: '#' }, // /manifesto
                                { name: 'Documentation', path: '#' }, // /docs
                                { name: 'Contact Support', path: '#' }, // /support
                                { name: 'About Us', path: '#' } // /about
                            ].map((item) => (
                                <motion.li key={item.name} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                    <Link to={item.path} className="hover:text-blue-400 transition-all border-b border-transparent hover:border-blue-400/30 pb-0.5 inline-block">{item.name}</Link>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false }}
                    className="flex flex-col md:flex-row items-end justify-between pt-8 border-t border-white/5 text-[9px] text-slate-600 font-mono tracking-widest uppercase"
                >
                    <p>© 2026 STROKE INTELLIGENCE. ALL RIGHTS RESERVED.</p>
                    <div className="flex gap-10 mt-6 md:mt-0 items-center">
                        <span className="flex items-center gap-2 group cursor-help">
                            <motion.span
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1 h-1 rounded-full bg-blue-500"
                            />
                            Made in algeria
                        </span>
                        <span className="text-slate-800">Protocol.v2.1.4_R</span>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
