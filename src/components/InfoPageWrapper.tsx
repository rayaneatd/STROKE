
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
        <div className="min-h-screen bg-[#0e0e10] text-slate-200 overflow-x-hidden font-sans selection:bg-blue-500/30">
            <div className="relative origin-top w-full" style={{ zoom: 0.8 }}>
                {/* Global Noise Overlay */}
                <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                <LandingHeader onCTA={handleCTA} isAuthenticated={isAuthenticated} />

                <main className="relative z-10 w-full flex flex-col items-center pt-32 pb-20 px-6 md:px-12 container mx-auto">
                    {children}
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default InfoPageWrapper;
