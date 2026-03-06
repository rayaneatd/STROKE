
import React from 'react';
import InfoPageWrapper from '../components/InfoPageWrapper';

const AboutUs: React.FC = () => {
    return (
        <InfoPageWrapper>
            <div className="w-full">
                <div className="max-w-4xl mx-auto mb-24">
                    <span className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block">The Team</span>
                    <h1 className="text-5xl md:text-8xl font-black mb-12 italic tracking-tighter leading-none">
                        About <br /> Us.
                    </h1>

                    <div className="space-y-16 text-slate-400">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-100 italic mb-6">Born from Frustration.</h2>
                            <p className="text-lg font-light leading-relaxed max-w-3xl">
                                STROKE was founded in Paris by a team of engineers and recruiters who realized that the "AI Revolution" in HR was mostly marketing fluff. Most tools were just faster versions of old, broken systems. We decided to build a system that actually thinks.
                            </p>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="glass-card p-10 border-white/5">
                                <h3 className="text-xl font-bold text-slate-100 italic mb-4">Our Vision</h3>
                                <p className="text-sm leading-relaxed">
                                    A world where hiring is based on objective potential rather than CV formatting skills. Where context is the primary signal, and meritocracy is enforced by intelligent logic.
                                </p>
                            </div>
                            <div className="glass-card p-10 border-white/5">
                                <h3 className="text-xl font-bold text-slate-100 italic mb-4">Our Tech</h3>
                                <p className="text-sm leading-relaxed">
                                    We are a tech-first company. We contribute to open-source neural models and maintain a strictly EU-based infrastructure to ensure data sovereignty for the modern enterprise.
                                </p>
                            </div>
                        </section>

                        <section className="pt-12 border-t border-white/5">
                            <h2 className="text-2xl font-bold text-slate-100 italic mb-12">Headquarters</h2>
                            <div className="flex flex-col md:flex-row gap-12 items-center">
                                <div className="text-left font-mono tracking-widest uppercase">
                                    <p className="text-blue-500 font-bold mb-2">Paris — FR, EU</p>
                                    <p className="text-slate-500 text-sm">Station F, 5 Parvis Alan Turing <br /> 75013 Paris</p>
                                </div>
                                <div className="w-full h-48 bg-slate-900 border border-white/5 rounded-2xl overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-500">
                                    <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80" alt="Paris" className="w-full h-full object-cover opacity-50" />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default AboutUs;
