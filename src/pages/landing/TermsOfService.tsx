import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';

const TermsOfService: React.FC = () => {
  return (
    <InfoPageWrapper>
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-5xl md:text-8xl font-black mb-12 italic tracking-tighter leading-none">
          Terms of <br /> Service.
        </h1>
        <div className="prose prose-invert max-w-none text-zinc-400">
          <p className="mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 italic">General Terms</h2>
              <p>By using STROKE, you agree to these terms of service. Our platform provides AI-driven recruitment analysis intended for professional use.</p>
            </div>
            {/* Add more sections as needed */}
          </section>
        </div>
      </div>
    </InfoPageWrapper>
  );
};

export default TermsOfService;
