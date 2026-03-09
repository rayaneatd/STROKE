
import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';
import { Lock, Globe, Server } from 'lucide-react';

const SecurityWhitepaper: React.FC = () => {
    return (
        <InfoPageWrapper>
            <div className="w-full">
                <div className="max-w-4xl mx-auto mb-24">
                    <span className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block">Security & Governance</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter leading-none">
                        Fortified <br /> Core.
                    </h1>
                    <p className="text-xl text-slate-400 font-light leading-relaxed">
                        Security is not a feature at STROKE; it's the foundation. Our infrastructure is engineered for the highest standards of data protection.
                    </p>
                </div>

                <div className="space-y-12 mb-24 max-w-5xl mx-auto">
                    <div className="glass-card p-12 border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent">
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Server size={32} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-6 italic">Google Cloud Infrastructure</h3>
                                <p className="text-slate-400 leading-relaxed mb-6">
                                    STROKE is natively deployed on Google Cloud Platform (GCP). We leverage GCP's hardened infrastructure, multi-layered security, and global compliance certifications.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ISO/IEC 27001 Certified</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> SOC 2 Type II Compliant</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> HIPAA Ready</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> PCI DSS Compliant</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-12 border-white/5">
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                <Lock size={32} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-6 italic">Encryption Protocols</h3>
                                <p className="text-slate-400 leading-relaxed mb-4">
                                    All data is encrypted at rest using AES-256 and in transit using TLS 1.3. We utilize Google Cloud Key Management Service (KMS) for robust cryptographic key handling.
                                </p>
                                <p className="text-slate-500 text-sm">
                                    Encryption keys are rotated regularly and access is strictly governed by IAM policies with least-privilege principles.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-12 border-white/5">
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <Globe size={32} className="text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-6 italic">EU Data Residency</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Our primary compute and storage resources are located in the <span className="text-slate-200">europe-west9 (Paris)</span> region. This ensures that sensitive candidate data never leaves the European Union, facilitating local compliance and low-latency processing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default SecurityWhitepaper;
