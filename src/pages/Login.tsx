import React from 'react';
import { useLogin } from '../hooks/useLogin';
import { Turnstile } from '@marsidev/react-turnstile';
import { Loader2, Mail, Check, ArrowRight, X, Linkedin, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import { useTranslation, Trans } from 'react-i18next';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const {
        email,
        setEmail,
        handleMagicLinkLogin,
        handleSocialLogin,
        handleLinkedInLogin,
        handleSamlLogin,
        socialLoading,
        magicLinkLoading,
        marketingConsent,
        setMarketingConsent,
        captchaToken,
        setCaptchaToken,
        error,
        magicLinkSuccess,
        setMagicLinkSuccess
    } = useLogin();

    const turnstileSiteKey = (import.meta as any).env.VITE_TURNSTILE_SITE_KEY;

    return (
        <div className="h-screen w-screen bg-[#050505] overflow-hidden">
            <div className="app-zoom-container flex items-center justify-center p-4 relative">
                {/* Ambient Background Effects */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md bg-[#0A0A0A] border border-white/5 rounded-2xl px-8 pb-8 pt-0 shadow-2xl relative z-10">
                    {/* Header / Branding */}
                    <div className="text-center mb-8 flex flex-col items-center">
                        <Logo variant="full" height={120} className="mb-4" />
                        <p className="text-zinc-400">{t('auth.welcomeBack')}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => handleSocialLogin('azure')}
                            disabled={!!socialLoading || magicLinkLoading}
                            className="w-full flex items-center justify-center gap-2 bg-[#2F2F2F] hover:bg-[#3F3F3F] text-white font-medium py-2.5 px-3 rounded-lg transition-all border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed group text-sm"
                        >
                            {socialLoading === 'azure' ? (
                                <Loader2 className="animate-spin text-white" size={18} />
                            ) : (
                                <>
                                    {/* Microsoft Logo SVG */}
                                    <svg className="w-4 h-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                                        <path fill="#f35325" d="M1 1h10v10H1z" />
                                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                                    </svg>
                                    <span>{t('auth.continueWithMicrosoft')}</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handleSocialLogin('google')}
                            disabled={!!socialLoading || magicLinkLoading}
                            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-black font-medium py-2.5 px-3 rounded-lg transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {socialLoading === 'google' ? (
                                <Loader2 className="animate-spin text-black" size={18} />
                            ) : (
                                <>
                                    {/* Google Logo SVG */}
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span>{t('auth.continueWithGoogle')}</span>
                                </>
                            )}
                        </button>

                        {/* LinkedIn (Coming Soon) */}
                        <button
                            onClick={handleLinkedInLogin}
                            disabled={true}
                            className="w-full flex items-center justify-center gap-2 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] font-medium py-2.5 px-3 rounded-lg transition-all border border-[#0077b5]/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[#0077b5]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <span className="text-white text-xs font-bold">{t('auth.comingSoon')}</span>
                            </div>
                            <Linkedin size={18} />
                            <span>{t('auth.continueWithLinkedIn')}</span>
                        </button>

                        {/* SAML SSO (Coming Soon) */}
                        <button
                            onClick={handleSamlLogin}
                            disabled={true}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium py-2.5 px-3 rounded-lg transition-all border border-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <span className="text-white text-xs font-bold">{t('auth.comingSoon')}</span>
                            </div>
                            <Shield size={18} />
                            <span>{t('auth.continueWithSAML')}</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#0A0A0A] text-zinc-500">{t('auth.orEmail')}</span>
                        </div>
                    </div>

                    {/* Magic Link Form */}
                    <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">{t('auth.emailLabel')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.emailPlaceholder')}
                                    className="w-full bg-[#111111] border border-white/10 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block pl-10 p-2.5 placeholder-zinc-600 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-3">
                            <label className="flex items-start gap-2 cursor-pointer group">
                                <div className="relative flex items-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={marketingConsent}
                                        onChange={(e) => setMarketingConsent(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-4 h-4 border border-zinc-600 rounded bg-transparent peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                                    <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 left-[2px] top-[2px] pointer-events-none" />
                                </div>
                                <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors leading-tight">
                                    {t('auth.marketingConsent')}
                                </span>
                            </label>
                        </div>

                        {/* Turnstile Captcha */}
                        <div className="flex justify-center">
                            <Turnstile
                                siteKey={turnstileSiteKey || '1x00000000000000000000AA'}
                                onSuccess={(token) => setCaptchaToken(token)}
                                onError={(err) => {
                                    console.error('Turnstile Error:', err);
                                    setCaptchaToken(null);
                                }}
                                onExpire={() => setCaptchaToken(null)}
                                options={{
                                    theme: 'dark',
                                    retry: 'auto',
                                    refreshExpired: 'auto'
                                }}
                                scriptOptions={{
                                    appendTo: 'head',
                                    onError: () => {
                                        console.error('Turnstile script failed to load');
                                    }
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!!socialLoading || magicLinkLoading || !captchaToken}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                        >
                            {magicLinkLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{t('auth.magicLink')}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Legal */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-zinc-600">
                            {t('auth.termsAgree')}{' '}
                            <Link to="/terms-of-service" className="text-zinc-400 hover:text-white underline decoration-zinc-700 hover:decoration-white transition-all">
                                {t('auth.terms')}
                            </Link>
                            {' '}{t('auth.and')}{' '}
                            <Link to="/privacy-policy" className="text-zinc-400 hover:text-white underline decoration-zinc-700 hover:decoration-white transition-all">
                                {t('auth.privacy')}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Success Modal */}
                {magicLinkSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 max-w-sm w-full relative shadow-2xl animate-fade-in-up">
                            <button
                                onClick={() => setMagicLinkSuccess(false)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                                    <Mail className="text-blue-500" size={32} />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{t('auth.magicLinkSent.title')}</h3>
                                <p className="text-zinc-400 mb-6">
                                    <Trans i18nKey="auth.magicLinkSent.desc" values={{ email }}>
                                        We've sent a magic link to <span className="text-white font-medium">{email}</span>.
                                        <br />Click the link to sign in.
                                    </Trans>
                                </p>

                                <button
                                    onClick={() => window.location.href = `mailto:`}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {t('auth.magicLinkSent.openEmail')}
                                </button>

                                <button
                                    onClick={() => setMagicLinkSuccess(false)}
                                    className="mt-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {t('auth.magicLinkSent.later')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
