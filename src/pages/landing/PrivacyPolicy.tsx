import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';

const PrivacyPolicy: React.FC = () => {
  return (
    <InfoPageWrapper>
      <div className="max-w-4xl mx-auto w-full space-y-16">
        <header className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white italic">
            Privacy <br /> Policy.
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
            Last Updated: March 29, 2026 {/*//! IMPORTANT'*/}
          </p>
          <div className="h-px w-full bg-gradient-to-r from-blue-500/50 to-transparent" />
        </header>

        <div className="prose prose-invert max-w-none space-y-12 text-zinc-400 leading-relaxed">
          <section>
            <p className="text-lg">
              At STROKE ("we," "our," or "us"), we prioritize the security and privacy of your data. This Privacy Policy explains how we collect, use, and protect information within the STROKE recruitment platform, in strict compliance with the General Data Protection Regulation (GDPR) and the EU AI Act.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">1. Data Controller</h2>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-2">
              <p><strong className="text-zinc-200">Entity:</strong> Rayane AIT ADAR</p>
              <p><strong className="text-zinc-200">Infrastructure:</strong> Hosted on Supabase (EU-West-1, Ireland)</p>
              <p><strong className="text-zinc-200">Contact:</strong> contact.rayaneatd@gmail.com</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">2. Information We Collect</h2>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-zinc-200">2.1 User Data (Recruiters & Agency Staff)</h3>
              <p>To provide our services, we collect the following information when you create an account:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-zinc-300">Identity & Contact:</strong> Name, email address, company name, and industry.</li>
                <li><strong className="text-zinc-300">Usage Data:</strong> Subscription plan, scan balance, and interface preferences.</li>
                <li><strong className="text-zinc-300">Consent:</strong> Marketing and feedback communication preferences.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-zinc-200">2.2 Candidate Data (Resume Processing)</h3>
              <p>When you upload resumes to STROKE, we process the following data extracted from the documents:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-zinc-300">Contact Info:</strong> Name, email, phone number, and location.</li>
                <li><strong className="text-zinc-300">Professional History:</strong> Current position, years of experience, and career trajectory.</li>
                <li><strong className="text-zinc-300">AI-Generated Insights:</strong> Match scores, technical skill gaps, soft skills analysis, and automated summaries.</li>
                <li><strong className="text-zinc-300">Source Files:</strong> Original resume files (PDF) stored securely in our cloud storage.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">3. Purpose & Legal Basis for Processing</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-zinc-900/30 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-zinc-800/50 text-zinc-200">
                    <th className="p-4 border-b border-zinc-700">Purpose</th>
                    <th className="p-4 border-b border-zinc-700">Data Category</th>
                    <th className="p-4 border-b border-zinc-700">Legal Basis (GDPR)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="p-4 border-b border-zinc-800">Account Management</td>
                    <td className="p-4 border-b border-zinc-800">User Identity</td>
                    <td className="p-4 border-b border-zinc-800">Performance of Contract</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-zinc-800">Resume Ranking & Analysis</td>
                    <td className="p-4 border-b border-zinc-800">Candidate Data</td>
                    <td className="p-4 border-b border-zinc-800">Legitimate Interest</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-zinc-800">System Security & Audit</td>
                    <td className="p-4 border-b border-zinc-800">System Logs</td>
                    <td className="p-4 border-b border-zinc-800">Legal Obligation</td>
                  </tr>
                  <tr>
                    <td className="p-4">Product Updates</td>
                    <td className="p-4">User Email</td>
                    <td className="p-4">Consent (Opt-in)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">4. AI Transparency & EU AI Act Compliance</h2>
            <p>In accordance with the <strong className="text-zinc-200">EU AI Act (Art. 13 & 14)</strong>, STROKE provides full transparency on its automated systems:</p>
            <ul className="list-disc pl-6 space-y-4">
              <li><strong className="text-zinc-300">Assistive Logic:</strong> Our AI ranks candidates but <strong className="text-blue-400">never filters or rejects them automatically</strong>. All candidates remain visible to the recruiter.</li>
              <li><strong className="text-zinc-300">Scoring Transparency:</strong> Scores are calculated based on four objective dimensions: Technical Skills, Experience, Education, and Soft Skills.</li>
              <li><strong className="text-zinc-300">Human Oversight:</strong> Recruiters have the absolute right and technical ability to override any AI-generated score or insight.</li>
              <li><strong className="text-zinc-300">Non-Discrimination:</strong> Our models are strictly instructed to ignore protected characteristics (age, gender, ethnicity, religion, disability, or family status).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">5. Data Retention & Deletion</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-300">Active Data:</strong> We retain candidate data and resumes as long as the associated Project exists in your workspace.</li>
              <li><strong className="text-zinc-300">User Request:</strong> You may delete candidates, projects, or your entire account at any time.</li>
              <li><strong className="text-zinc-300">No Automatic Deletion:</strong> Currently, data is retained until manually deleted by the user to ensure project continuity.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">6. Subprocessors & Third-Party Services</h2>
            <p>We use a limited number of trusted partners. The majority operate within the European Union. One sub-processor (Inception Labs) is based in the United States, with transfers governed by Standard Contractual Clauses (Article 46 GDPR):</p>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-800/50 text-zinc-200">
                    <th className="p-4 border-b border-zinc-700">Provider</th>
                    <th className="p-4 border-b border-zinc-700">Service</th>
                    <th className="p-4 border-b border-zinc-700">Location</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="p-4 border-b border-zinc-800 font-bold text-zinc-300">Supabase Inc.</td>
                    <td className="p-4 border-b border-zinc-800">Database, Auth, Storage</td>
                    <td className="p-4 border-b border-zinc-800">Ireland</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-zinc-800 font-bold text-zinc-300">Mistral AI</td>
                    <td className="p-4 border-b border-zinc-800">OCR & AI Analysis</td>
                    <td className="p-4 border-b border-zinc-800">France</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-zinc-300">Mercury 2 (Inception Labs)</td>
                    <td className="p-4">AI Analysis only</td>
                    <td className="p-4">United States (SCC framed)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm italic text-blue-400/80">
              [View Inception Labs DPA] //TODO: Add link to DPA 
            </p>

          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">7. AI Model Training</h2>
            <p className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
              <strong className="text-blue-400">We do not use your data or your candidates' resumes to train public AI models.</strong> All processing is performed via private API instances where data is processed for inference only and not retained by the AI providers for training purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">8. Your Rights (GDPR)</h2>
            <p>You and your candidates have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-300">Right to Access:</strong> Request a copy of the data we hold.</li>
              <li><strong className="text-zinc-300">Right to Rectification:</strong> Correct inaccurate data.</li>
              <li><strong className="text-zinc-300">Right to Erasure:</strong> Request the deletion of data.</li>
              <li><strong className="text-zinc-300">Right to Explanation:</strong> Request an explanation of how a specific AI score was reached.</li>
            </ul>
          </section>

          <footer className="pt-12 border-t border-zinc-800 space-y-4">
            <p className="text-sm text-zinc-500 italic">
              Note: This policy is based on the current technical architecture of the STROKE codebase. Before going live, we recommend verifying final hosting regions and confirming DPAs with all AI providers.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 uppercase tracking-widest">
              <span>Security Protocol: v2.1.4_R</span>
              <span>•</span>
              <span>GDPR Compliant Architecture</span>
            </div>
          </footer>
        </div>
      </div>
    </InfoPageWrapper>
  );
};

export default PrivacyPolicy;
