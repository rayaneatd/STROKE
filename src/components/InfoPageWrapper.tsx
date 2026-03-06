
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './landing/LandingHeader';
import Footer from './landing/Footer';
import { useAuth } from '../context/AuthContext';

interface InfoPageWrapperProps {
    children: React.ReactNode;
}

const InfoPageWrapper: React.FC<InfoPageWrapperProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleCTA = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="relative min-h-[125vh] w-[125vw] left-1/2 -translate-x-1/2 scale-[0.8] origin-top bg-[#0e0e10] text-slate-200 overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Global Noise Overlay */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <LandingHeader onCTA={handleCTA} isAuthenticated={isAuthenticated} />

            <main className="relative z-10 w-full flex flex-col items-center pt-32 pb-20 px-6 md:px-12 container mx-auto">
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default InfoPageWrapper;
