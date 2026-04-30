
import React, { Suspense, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider
import { ComingSoonProvider, useComingSoon } from './context/ComingSoonContext';
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
const LandingPage = React.lazy(() => import('./pages/landing/LandingPage'));
const Login = React.lazy(() => import('./pages/landing/Login'));
const TermsOfService = React.lazy(() => import('./pages/landing/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/landing/PrivacyPolicy'));
const RefundPolicy = React.lazy(() => import('./pages/landing/RefundPolicy'));
const DeepLogic = React.lazy(() => import('./pages/landing/DeepLogic'));
const Pricing = React.lazy(() => import('./pages/landing/Pricing'));
const SecurityWhitepaper = React.lazy(() => import('./pages/landing/SecurityWhitepaper'));
const Manifesto = React.lazy(() => import('./pages/landing/Manifesto'));
const Documentation = React.lazy(() => import('./pages/landing/Documentation'));
const ContactSupport = React.lazy(() => import('./pages/landing/ContactSupport'));
const AboutUs = React.lazy(() => import('./pages/landing/AboutUs'));
const Transparency = React.lazy(() => import('./pages/landing/Transparency'));

// App Pages
const Dashboard = React.lazy(() => import('./pages/app/Dashboard'));
const Projects = React.lazy(() => import('./pages/app/Projects'));
const ProjectDetail = React.lazy(() => import('./pages/app/ProjectDetail'));
const AdminDashboard = React.lazy(() => import('./pages/app/AdminDashboard'));
const Settings = React.lazy(() => import('./pages/app/Settings'));
const Connections = React.lazy(() => import('./pages/app/Connections'));
const BuyScans = React.lazy(() => import('./pages/app/BuyScans'));
const UpgradePlan = React.lazy(() => import('./pages/app/UpgradePlan'));
const Profile = React.lazy(() => import('./pages/app/Profile'));

import { useParams } from 'react-router-dom';

const ProjectDetailWrapper = ({ user, onNavigate, onUpdateUser }: { user: User, onNavigate: (p: string) => void, onUpdateUser: (u: User) => void }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) return <Navigate to="/app/projects" replace />;

    return (
        <ProjectDetail
            projectId={id}
            onBack={() => navigate('/app/projects')}
            deductScans={() => true} // Logic handled internally via services
            currentUser={user}
            onNavigate={onNavigate}
            onUpdateUser={onUpdateUser}
        />
    );
};

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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const { user, logout, updateUser, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const { checkComingSoon } = useComingSoon();

    useEffect(() => {
        if (!user) return;
        const syncLanguage = async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('preferences')
                .eq('id', user.id)
                .single();

            const prefs = profile?.preferences as any;
            const storedLanguage = prefs?.language;

            if (storedLanguage && storedLanguage !== i18n.language) {
                i18n.changeLanguage(storedLanguage);
            } else if (!storedLanguage) {
                await supabase
                    .from('profiles')
                    .update({
                        preferences: {
                            ...(prefs || {}),
                            language: i18n.language
                        }
                    })
                    .eq('id', user.id);
            }
        };
        syncLanguage();
    }, [user?.id, i18n]);

    useEffect(() => {
        if (!user) return;

        const banCheckInterval = setInterval(() => {
            if (!user?.id) return;
            const freshUserRecord = getUser(user.id);

            if (freshUserRecord) {
                if (freshUserRecord.isBanned && !user.isBanned) {
                    updateUser(freshUserRecord);
                }
                if (!freshUserRecord.isBanned && user.isBanned) {
                    updateUser(freshUserRecord);
                }
            }
        }, 2000);

        return () => clearInterval(banCheckInterval);
    }, [user, updateUser]);

    // Theme handling moved to AppThemeWrapper

    const getCurrentPageId = () => {
        const path = location.pathname;
        if (path === '/app' || path === '/app/dashboard') return 'dashboard';
        if (path.startsWith('/app/projects')) return 'projects';
        if (path.startsWith('/app/connections')) return 'connections';
        if (path.startsWith('/app/settings')) return 'settings';
        if (path.startsWith('/app/admin')) return 'admin';
        if (path.startsWith('/app/profile')) return 'profile';
        if (path.startsWith('/app/buy-scans')) return 'buy-scans';
        return 'dashboard';
    };

    const handleNavigate = useCallback((pageId: string) => {
        const go = () => {
            switch (pageId) {
                case 'dashboard': navigate('/app'); break;
                case 'projects': navigate('/app/projects'); break;
                case 'connections': navigate('/app/connections'); break;
                case 'settings': navigate('/app/settings'); break;
                case 'admin': navigate('/app/admin'); break;
                case 'profile': navigate('/app/profile'); break;
                case 'buy-scans': navigate('/app/buy-scans'); break;
                case 'upgrade-plan': navigate('/app/upgrade-plan'); break;
                default: navigate('/app');
            }
        };

        if (pageId === 'upgrade-plan' || pageId === 'buy-scans') {
            checkComingSoon(go);
        } else {
            go();
        }
    }, [navigate, checkComingSoon]);

    const handleProjectClick = useCallback((projectId: string) => {
        navigate(`/app/projects/${projectId}`);
    }, [navigate]);

    const handleUpdateUser = useCallback((updatedUser: User) => {
        updateUser(updatedUser);
    }, [updateUser]);

    const commonLayoutProps = user ? {
        user,
        onLogout: logout,
        currentPage: getCurrentPageId(),
        onNavigate: handleNavigate,
        onBuyScans: () => checkComingSoon(() => navigate('/app/buy-scans'))
    } : null;

    return (
        <>
            {user?.isBanned && (
                <GlobalBanModal user={user} onLogout={logout} />
            )}

            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/app" replace /> : <Login />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/deep-logic" element={<DeepLogic />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/security" element={<SecurityWhitepaper />} />
                    <Route path="/manifesto" element={<Manifesto />} />
                    <Route path="/docs" element={<Documentation />} />
                    <Route path="/support" element={<ContactSupport />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/transparency" element={<Transparency />} />

                    <Route path="/app/*" element={
                        <ProtectedRoute>
                            {user ? (
                                <Layout {...commonLayoutProps!}>
                                    <Suspense fallback={<ContentLoader />}>
                                        <Routes>
                                            <Route index element={<Dashboard currentUser={user} onNavigate={handleNavigate} />} />
                                            <Route path="projects" element={
                                                <ErrorBoundary className="m-8">
                                                    <Projects
                                                        currentUser={user!}
                                                        onProjectClick={handleProjectClick}
                                                        onNavigate={handleNavigate}
                                                        onUpdateUser={handleUpdateUser}
                                                    />
                                                </ErrorBoundary>
                                            } />
                                            <Route path="projects/:id" element={
                                                <ErrorBoundary className="m-8">
                                                    {user ? (
                                                        <ProjectDetailWrapper
                                                            user={user}
                                                            onNavigate={handleNavigate}
                                                            onUpdateUser={handleUpdateUser}
                                                        />
                                                    ) : <Navigate to="/login" replace />}
                                                </ErrorBoundary>
                                            } />
                                            <Route path="settings" element={
                                                user ? (
                                                    <Settings
                                                        user={user}
                                                        onUpdateUser={handleUpdateUser}
                                                        onLogout={logout}
                                                    />
                                                ) : <Navigate to="/login" replace />
                                            } />
                                            <Route path="admin" element={
                                                user ? (
                                                    <AdminDashboard
                                                        currentUser={user}
                                                        onNavigate={handleNavigate}
                                                    />
                                                ) : <Navigate to="/login" replace />
                                            } />
                                            <Route path="connections" element={user ? <Connections currentUser={user} /> : <Navigate to="/login" replace />} />
                                            <Route path="profile" element={
                                                user ? (
                                                    <Profile
                                                        user={user}
                                                        onUpdateUser={handleUpdateUser}
                                                        onNavigate={handleNavigate}
                                                    />
                                                ) : <Navigate to="/login" replace />
                                            } />
                                            <Route path="buy-scans" element={
                                                <BuyScans
                                                    onBack={() => navigate(-1)}
                                                    onBuy={(amount) => {
                                                        if (user) {
                                                            updateUser({ scansBalance: (user.scansBalance || 0) + amount });
                                                        }
                                                    }}
                                                    currentBalance={user?.scansBalance || 0}
                                                />
                                            } />
                                            <Route path="upgrade-plan" element={
                                                user ? (
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
                                                ) : <Navigate to="/login" replace />
                                            } />
                                            <Route path="*" element={<Navigate to="/app" replace />} />
                                        </Routes>
                                    </Suspense>
                                </Layout>
                            ) : <PageLoader />}
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </>
    );
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const AppThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, updateUser } = useAuth();

    const handleThemeChange = useCallback((newConfig: UIPreferences) => {
        if (user) {
            updateUser({ preferences: { ...user.preferences, uiConfig: newConfig } as any }, true);
        }
    }, [user, updateUser]);

    return (
        <ThemeProvider initialConfig={user?.preferences?.uiConfig} onConfigChange={handleThemeChange}>
            {children}
        </ThemeProvider>
    );
};

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <AppThemeWrapper>
                        <ComingSoonProvider>
                            <AppContent />
                        </ComingSoonProvider>
                    </AppThemeWrapper>
                </AuthProvider>
            </BrowserRouter>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default App;
