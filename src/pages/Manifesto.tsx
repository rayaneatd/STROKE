
import React from 'react';
import InfoPageWrapper from '../components/InfoPageWrapper';

const Manifesto: React.FC = () => {
    return (
        <InfoPageWrapper>
            <div className="max-w-3xl mx-auto w-full">
                <span className="text-blue-500 font-mono text-[10px] tracking-[0.6em] uppercase mb-4 block">The Mission</span>
                <h1 className="text-5xl md:text-8xl font-black mb-12 italic tracking-tighter leading-none">
                    The <br /> Manifesto.
                </h1>

                <div className="space-y-12 text-xl font-light text-slate-300 leading-relaxed border-l-2 border-blue-500/20 pl-8 md:pl-16 py-8">
                    <p>
                        Recruiting is broken. Not just slightly inefficient, but fundamentally, structurally broken.
                    </p>

                    <p className="italic text-slate-100 font-medium">
                        The current standard is a race to the bottom.
                    </p>

                    <p>
                        Companies treat humans like strings of characters. High-potential talent is being discarded by 20-year-old keyword matchers that understand nothing of ambition, trajectory, or context.
                    </p>

                    <p>
                        At <span className="text-blue-500 font-bold">STROKE</span>, we believe hiring should be an art of prediction, not a search for keys. We build tools that see what legacy parsers simply cannot: the underlying signal of success.
                    </p>

                    <p className="text-3xl font-black text-slate-100 tracking-tighter italic">
                        Truth over strings. <br />
                        Context over keywords.
                    </p>

                    <p>
                        We are here to restore the signal. Join us.
                    </p>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default Manifesto;
