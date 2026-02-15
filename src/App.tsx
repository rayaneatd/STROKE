
import React, { Suspense, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { User, SubscriptionPlan, UIPreferences } from './types';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import GlobalBanModal from './components/modals/GlobalBanModal'; // Import the new modal
import { getUser } from './services/mockData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabase';


// --- LAZY LOADED ROUTES (Code Splitting) ---
const Login = React.lazy(() => import('./pages/Login'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/Projects'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Connections = React.lazy(() => import('./pages/Connections'));
const BuyScans = React.lazy(() => import('./pages/BuyScans'));
const UpgradePlan = React.lazy(() => import('./pages/UpgradePlan'));
const Profile = React.lazy(() => import('./pages/Profile'));

// Wrapper to extract route params for ProjectDetail
import { useParams } from 'react-router-dom';

const ProjectDetailWrapper = ({ user, onNavigate, onUpdateUser }: { user: User, onNavigate: (p: string) => void, onUpdateUser: (u: User) => void }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) return <Navigate to="/projects" replace />;

    return (
        <ProjectDetail
            projectId={id}
            onBack={() => navigate('/projects')}
            deductScans={() => true} // Logic handled internally via services
            currentUser={user}
            onNavigate={onNavigate}
            onUpdateUser={onUpdateUser}
        />
    );
};

// --- LOADING FALLBACK ---
const PageLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#050505] text-zinc-400">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="text-xs font-medium uppercase tracking-widest opacity-50">Loading Resource</p>
        </div>
    </div>
);

const ContentLoader = () => (
    <div className="flex h-full w-full items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-zinc-500/50" size={32} />
    </div>
);

const getThemeForPlan = (plan: SubscriptionPlan) => {
    switch (plan) {
        case SubscriptionPlan.ELITE: return { accent: 'amber', glow: 'amber' };
        case SubscriptionPlan.TEAM: return { accent: 'violet', glow: 'violet' };
        case SubscriptionPlan.PRO: return { accent: 'blue', glow: 'blue' };
        case SubscriptionPlan.ESSENTIAL: return { accent: 'emerald', glow: 'emerald' };
        default: return { accent: 'slate', glow: 'slate' };
    }
}

// --- MAIN APP CONTENT ---
const AppContent: React.FC = () => {
    const { user, logout, updateUser, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();

    // --- LANGUAGE SYNC ---
    useEffect(() => {
        if (!user) return;

        // 1. Sync i18n with user profile language on load
        const syncLanguage = async () => {
            // Get latest profile data including language
            const { data: profile } = await supabase
                .from('profiles')
                .select('language')
                .eq('id', user.id)
                .single();
            
            if (profile?.language && profile.language !== i18n.language) {
                i18n.changeLanguage(profile.language);
            } else if (!profile?.language) {
                // If no language in DB, update DB with current detected language
                await supabase
                    .from('profiles')
                    .update({ language: i18n.language })
                    .eq('id', user.id);
            }
        };

        syncLanguage();
    }, [user?.id]); // Run when user ID changes (login)

    // --- REAL-TIME BAN ENFORCEMENT ---
    useEffect(() => {
        if (!user) return;

        // Poll every 2 seconds to check status from "backend"
        const banCheckInterval = setInterval(() => {
            if (!user?.id) return;
            const freshUserRecord = getUser(user.id);

            if (freshUserRecord) {
                // If backend says banned but local state says active, SYNC IT.
                // This triggers the GlobalBanModal to render.
                if (freshUserRecord.isBanned && !user.isBanned) {
                    updateUser(freshUserRecord);
                }

                // Optional: Auto-unban logic (if backend unbans, sync it back)
                if (!freshUserRecord.isBanned && user.isBanned) {
                    updateUser(freshUserRecord);
                }
            }
        }, 2000);

        return () => clearInterval(banCheckInterval);
    }, [user, updateUser]);

    // Handle Theme Updates from anywhere
    const handleThemeChange = (newConfig: UIPreferences) => {
        if (user) {
            updateUser({ preferences: { ...user.preferences, uiConfig: newConfig } as any }, true);
        }
    };

    // Mapping for Sidebar Highlighting
    const getCurrentPageId = () => {
        const path = location.pathname;
        if (path === '/' || path === '/dashboard') return 'dashboard';
        if (path.startsWith('/projects')) return 'projects';
        if (path.startsWith('/connections')) return 'connections';
        if (path.startsWith('/settings')) return 'settings';
        if (path.startsWith('/admin')) return 'admin';
        if (path.startsWith('/profile')) return 'profile';
        if (path.startsWith('/buy-scans')) return 'buy-scans';
        return 'dashboard';
    };

    // Centralized Navigation Handler
    const handleNavigate = useCallback((pageId: string) => {
        switch (pageId) {
            case 'dashboard': navigate('/'); break;
            case 'projects': navigate('/projects'); break;
            case 'connections': navigate('/connections'); break;
            case 'settings': navigate('/settings'); break;
            case 'admin': navigate('/admin'); break;
            case 'profile': navigate('/profile'); break;
            case 'buy-scans': navigate('/buy-scans'); break;
            case 'upgrade-plan': navigate('/upgrade-plan'); break;
            default: navigate('/');
        }
    }, [navigate]);

    const handleProjectClick = useCallback((projectId: string) => {
        navigate(`/projects/${projectId}`);
    }, [navigate]);

    const handleUpdateUser = useCallback((updatedUser: User) => {
        updateUser(updatedUser);
    }, [updateUser]);

    if (loading) {
        return <PageLoader />;
    }

    // 1. Unauthenticated State
    if (!isAuthenticated || !user) {
        return (
            <ThemeProvider>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Suspense>
            </ThemeProvider>
        );
    }

    // 2. Authenticated State
    const commonLayoutProps = {
        user,
        onLogout: logout,
        currentPage: getCurrentPageId(),
        onNavigate: handleNavigate,
        onBuyScans: () => navigate('/buy-scans')
    };

    return (
        <ThemeProvider initialConfig={user.preferences?.uiConfig} onConfigChange={handleThemeChange}>
            {/* GLOBAL BAN MODAL INTERCEPTOR */}
            {user.isBanned && (
                <GlobalBanModal user={user} onLogout={logout} />
            )}

            {/* Onboarding disabled for migration phase
            {user && !user.hasCompletedOnboarding && !user.isBanned && (
                <OnboardingWizard user={user} onComplete={handleUpdateUser} />
            )}
            */}

            <Layout {...commonLayoutProps}>
                <Suspense fallback={<ContentLoader />}>
                    <Routes>
                        <Route path="/" element={<Dashboard currentUser={user} onNavigate={handleNavigate} />} />

                        <Route path="/projects" element={
                            <ErrorBoundary className="m-8">
                                <Projects
                                    currentUser={user}
                                    onProjectClick={handleProjectClick}
                                    onNavigate={handleNavigate}
                                    onUpdateUser={handleUpdateUser}
                                />
                            </ErrorBoundary>
                        } />

                        <Route path="/projects/:id" element={
                            <ErrorBoundary className="m-8">
                                <ProjectDetailWrapper
                                    user={user}
                                    onNavigate={handleNavigate}
                                    onUpdateUser={handleUpdateUser}
                                />
                            </ErrorBoundary>
                        } />

                        <Route path="/settings" element={
                            <Settings
                                user={user}
                                onUpdateUser={handleUpdateUser}
                                onLogout={logout}
                            />
                        } />

                        <Route path="/admin" element={
                            <AdminDashboard
                                currentUser={user}
                                onNavigate={handleNavigate}
                            />
                        } />

                        <Route path="/connections" element={
                            <Connections currentUser={user} />
                        } />

                        <Route path="/profile" element={
                            <Profile
                                user={user}
                                onUpdateUser={handleUpdateUser}
                                onNavigate={handleNavigate}
                            />
                        } />

                        <Route path="/buy-scans" element={
                            <BuyScans
                                onBack={() => navigate(-1)}
                                onBuy={(amount) => {
                                    updateUser({ scansBalance: (user.scansBalance || 0) + amount }, true);
                                    navigate(-1);
                                }}
                                currentBalance={user.scansBalance}
                            />
                        } />

                        <Route path="/upgrade-plan" element={
                            <UpgradePlan
                                onBack={() => navigate(-1)}
                                onUpgrade={(plan) => {
                                    const theme = getThemeForPlan(plan);
                                    updateUser({
                                        subscriptionPlan: plan,
                                        preferences: {
                                            ...user.preferences,
                                            uiConfig: {
                                                ...user.preferences?.uiConfig,
                                                accentColor: theme.accent as any,
                                                ambientGlow: theme.glow as any
                                            }
                                        } as any
                                    }, true);
                                }}
                                currentUser={user}
                            />
                        } />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </Layout>
        </ThemeProvider>
    );
};

// Initialize React Query Client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </HashRouter>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default App;
