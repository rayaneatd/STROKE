
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LandingHeader from './landing/LandingHeader';
import Footer from './landing/Footer';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface InfoPageWrapperProps {
    children: React.ReactNode;
}

const InfoPageWrapper: React.FC<InfoPageWrapperProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleCTA = () => {
        if (isAuthenticated) {
            navigate('/app');
        } else {
            navigate('/login');
        }
    };

    const handleBack = () => {
        // If there's history, go back. Otherwise go to home.
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="relative min-h-screen bg-[#0e0e10] text-slate-200 overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Global Noise Overlay */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <LandingHeader onCTA={handleCTA} isAuthenticated={isAuthenticated} />

            <main className="relative z-10 w-full flex flex-col items-center pt-32 pb-20 px-6 md:px-12 container mx-auto">
                {/* Advanced Return Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleBack}
                    className="group self-start mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium text-zinc-400 hover:text-white"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Go Back</span>
                </motion.button>

                {children}
            </main>


            <Footer />
        </div>
    );
};

export default InfoPageWrapper;

