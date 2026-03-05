import React from 'react';
import Logo from '../ui/Logo';

const Footer: React.FC = () => {
    return (
        <footer className="w-full border-t border-white/10 bg-black pt-20 pb-10 relative z-50">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Logo variant="full" height={48} />
                        <p className="mt-6 text-slate-400 text-sm max-w-sm">
                            The first Deep Logic parsing engine for High-Stakes recruitment. Stop matching keywords. Start understanding trajectory.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6 font-mono tracking-widest text-xs uppercase opacity-50">Platform</h4>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Enterprise Console</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">API Documentation</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 font-mono tracking-widest text-xs uppercase opacity-50">Security</h4>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">GDPR Manifesto</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Vertex AI Integration</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-xs text-slate-600 font-mono">
                    <p>© 2026 STROKE Intelligence. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span>Data Residency: Paris, EU</span>
                        <span>Engine Version: 2.1.4</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
