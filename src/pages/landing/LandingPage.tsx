import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from '../../components/landing/LandingHeader';
import HeroSection from '../../components/landing/sections/HeroSection';
import Footer from '../../components/landing/Footer';
import { useAuth } from '../../context/AuthContext';

// Lazy-load heavier sections to optimize initial load speed
const AgitationSection = React.lazy(() => import('../../components/landing/sections/AgitationSection'));
const FortressSection = React.lazy(() => import('../../components/landing/sections/FortressSection'));
const TheGapSection = React.lazy(() => import('../../components/landing/sections/TheGapSection'));
const CinematicProofSection = React.lazy(() => import('../../components/landing/sections/CinematicProofSection'));

const SectionLoader = () => (
    <div className="w-full h-80 flex items-center justify-center bg-[#0a0a0c]/50">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
);

const LandingPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleCTA = () => {
        if (isAuthenticated) {
            navigate('/app');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="relative min-h-screen bg-[#0e0e10] text-slate-200 overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Global Noise Overlay for magazine texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <LandingHeader onCTA={handleCTA} isAuthenticated={isAuthenticated} />

            <main className="relative z-10 w-full flex flex-col items-center">
                <HeroSection onCTA={handleCTA} isAuthenticated={isAuthenticated} />

                <Suspense fallback={<SectionLoader />}>
                    <AgitationSection />
                    <FortressSection />
                    <TheGapSection />
                    <CinematicProofSection onCTA={handleCTA} isAuthenticated={isAuthenticated} />
                </Suspense>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;

