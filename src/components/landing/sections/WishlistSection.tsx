import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const WishlistSection: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        
        setStatus('loading');
        
        try {
            const { error, data } = await supabase
                .from('wishlist')
                .insert([{ email }])
                .select();

            if (error) {
                console.error('Supabase error:', error.message, error.details, error.hint);
                throw error;
            }

            console.log('Success adding to wishlist:', data);
            setStatus('success');
            setEmail('');
        } catch (error: any) {
            console.error('Full error object:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <section className="relative w-full py-16 z-40 bg-[#0e0e10] overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <motion.div variants={itemVariants} className="mb-8">
                        <motion.h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-100 mb-4 italic">
                            Get notified when we open <br />
                            <span className="text-blue-500 not-italic">new beta slots.</span>
                        </motion.h2>
                        <motion.p className="text-slate-400 text-base font-light tracking-wide">
                            No spam. Just an invite when we're ready for more volume.
                        </motion.p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative max-w-md mx-auto">
                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-center gap-2.5 p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-mono text-xs tracking-widest uppercase"
                            >
                                <CheckCircle2 size={18} />
                                You're on the list. See you soon.
                            </motion.div>
                        ) : (
                            <>
                                <form onSubmit={handleSubmit} className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative flex items-center bg-[#0a0a0c] rounded-full border border-white/10 focus-within:border-blue-500/50 transition-all p-0.5">
                                        <div className="pl-4 text-slate-500">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full bg-transparent border-none focus:ring-0 text-slate-100 px-3 py-3 font-mono text-xs placeholder:text-slate-600"
                                            disabled={status === 'loading'}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={status === 'loading'}
                                            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {status === 'loading' ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Send size={18} />
                                            )}
                                        </button>
                                    </div>
                                </form>
                                {status === 'error' && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 text-red-500 font-mono text-[10px] uppercase tracking-widest"
                                    >
                                        Something went wrong. Please try again.
                                    </motion.p>
                                )}
                            </>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default WishlistSection;
