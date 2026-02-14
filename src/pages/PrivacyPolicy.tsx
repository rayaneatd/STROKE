import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Login
        </button>
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-zinc-400">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>[Privacy Policy content will be added here]</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
