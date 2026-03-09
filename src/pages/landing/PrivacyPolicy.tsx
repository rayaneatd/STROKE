import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';

const PrivacyPolicy: React.FC = () => {
  return (
    <InfoPageWrapper>
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-5xl md:text-8xl font-black mb-12 italic tracking-tighter leading-none">
          Privacy <br /> Policy.
        </h1>
        <div className="prose prose-invert max-w-none text-zinc-400">
          <p className="mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 italic">Commitment to Data Privacy</h2>
              <p>We take your privacy seriously. STROKE is designed with privacy by design principles. All candidate data is processed securely and in compliance with GDPR and other relevant regulations.</p>
            </div>
            {/* Add more sections as needed */}
          </section>
        </div>
      </div>
    </InfoPageWrapper>
  );
};

export default PrivacyPolicy;
