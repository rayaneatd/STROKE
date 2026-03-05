import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LandingHeader from '../components/landing/LandingHeader';
import HeroSection from '../components/landing/sections/HeroSection';
import AgitationSection from '../components/landing/sections/AgitationSection';
import FortressSection from '../components/landing/sections/FortressSection';
import TheGapSection from '../components/landing/sections/TheGapSection';
import CinematicProofSection from '../components/landing/sections/CinematicProofSection';
import Footer from '../components/landing/Footer';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleCTA = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="relative min-h-[125vh] w-[125vw] left-1/2 -translate-x-1/2 scale-[0.8] origin-top bg-[#0e0e10] text-slate-200 overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Global Noise Overlay for magazine texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <LandingHeader onCTA={handleCTA} isAuthenticated={isAuthenticated} />

            <main className="relative z-10 w-full flex flex-col items-center">
                <HeroSection onCTA={handleCTA} />
                <AgitationSection />
                <FortressSection />
                <TheGapSection />
                <CinematicProofSection onCTA={handleCTA} />
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
