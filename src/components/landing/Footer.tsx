import React from 'react';
import Logo from '../ui/Logo';

const Footer: React.FC = () => {
    return (
        <footer className="w-full border-t border-white/5 bg-[#0a0a0c] pt-32 pb-12 relative z-50">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 items-start">

                    {/* Brand / Logo Spread */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <Logo variant="full" height={48} />
                        <p className="mt-8 text-slate-400 text-lg font-light leading-relaxed italic max-w-sm">
                            Recruiting is no longer a search for strings. It is an art of trajectory analysis.
                        </p>

                        {/* Issue Tag detail */}
                        <div className="mt-12 flex items-center gap-6">
                            <div className="w-[1px] h-12 bg-slate-800" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono tracking-[0.4em] text-slate-600 uppercase">Issue v.2.1</span>
                                <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500/50 uppercase">Mar 2026 Archive</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Clusters (Asymmetrical) */}
                    <div className="lg:col-span-2 lg:col-start-7">
                        <h4 className="text-white font-bold mb-8 font-mono tracking-[0.3em] text-[10px] uppercase opacity-40">The Platform</h4>
                        <ul className="space-y-6 text-sm text-slate-400 font-medium">
                            <li><a href="#" className="hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400/30 pb-1">Governance Engine</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400/30 pb-1">API Integrations</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400/30 pb-1">Archive Search</a></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="text-white font-bold mb-8 font-mono tracking-[0.3em] text-[10px] uppercase opacity-40">Governance</h4>
                        <ul className="space-y-6 text-sm text-slate-400 font-medium">
                            <li><a href="#" className="hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400/30 pb-1">GDPR Compliance</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400/30 pb-1">Vertex AI Protocol</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400/30 pb-1">Data Residency</a></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-end justify-between pt-12 border-t border-white/5 text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                    <p>© 2026 STROKE INTELLIGENCE. ALL RIGHTS RESERVED.</p>
                    <div className="flex gap-12 mt-6 md:mt-0 items-center">
                        <span className="flex items-center gap-2 group cursor-help">
                            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                            Paris — FR, EU
                        </span>
                        <span className="text-slate-800">Protocol.v2.1.4_R</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
