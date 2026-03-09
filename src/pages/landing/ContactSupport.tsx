
import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';
import { Mail, MessageSquare, Phone } from 'lucide-react';

const ContactSupport: React.FC = () => {
    return (
        <InfoPageWrapper>
            <div className="w-full">
                <div className="max-w-4xl mx-auto mb-24 text-center">
                    <h1 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter">
                        Support.
                    </h1>
                    <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                        High-velocity teams need high-velocity support. We're here to solve any technical friction.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 max-w-5xl mx-auto">
                    <div className="glass-card p-12 border-white/5 text-center flex flex-col items-center">
                        <Mail className="text-blue-500 mb-6" size={32} />
                        <h3 className="text-lg font-bold mb-2 italic">Email</h3>
                        <p className="text-slate-500 text-sm mb-6">Standard support for all plans.</p>
                        <a href="mailto:support@airecruit.com" className="text-blue-400 font-mono text-sm underline tracking-widest">SUPPORT@AIRECRUIT.COM</a>
                    </div>

                    <div className="glass-card p-12 border-white/5 text-center flex flex-col items-center border-blue-500/20 bg-blue-500/5">
                        <MessageSquare className="text-blue-400 mb-6" size={32} />
                        <h3 className="text-lg font-bold mb-2 italic">Priority Chat</h3>
                        <p className="text-slate-500 text-sm mb-6">Available for Pro & Team users.</p>
                        <span className="text-blue-400 font-mono text-sm tracking-widest uppercase bg-blue-500/10 px-4 py-1 rounded-full">Active Now</span>
                    </div>

                    <div className="glass-card p-12 border-white/5 text-center flex flex-col items-center">
                        <Phone className="text-blue-500 mb-6" size={32} />
                        <h3 className="text-lg font-bold mb-2 italic">Dedicated Line</h3>
                        <p className="text-slate-500 text-sm mb-6">Elite plan 24/7 priority access.</p>
                        <span className="text-slate-500 font-mono text-sm tracking-widest">+1 (800) STROKE-AI</span>
                    </div>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default ContactSupport;
