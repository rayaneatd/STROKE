import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { MOCK_USERS } from '../services/mockData';
import { classifyEmailDomain, EmailType } from '../utils/emailDomains';

export const useLogin = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [magicLinkLoading, setMagicLinkLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [staySignedIn, setStaySignedIn] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [magicLinkSuccess, setMagicLinkSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const storedError = localStorage.getItem('login_error');
        if (storedError) {
            setError(storedError);
            localStorage.removeItem('login_error');
        }
    }, []);

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
        setShowPassword(true);
    };

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score++;
        if (pass.length >= 12) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (classifyEmailDomain(email) !== EmailType.PUBLIC) {
                setError(t('auth.errors.workEmailRequired'));
                setLoading(false);
                return;
            }
            if (isRegistering) {
                if (!displayName) throw new Error(t('auth.errors.nameRequired'));

                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: displayName
                        }
                    }
                });

                if (signUpError) throw signUpError;
                alert(t('auth.errors.checkEmail'));
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || t('auth.errors.unexpected'));
        } finally {
            setLoading(false);
        }
    };

    const handleLinkedInLogin = async () => {
        // TODO: Implement LinkedIn Login
        console.log("LinkedIn Login - Coming Soon");
    };

    const handleSamlLogin = async () => {
        // TODO: Implement SAML SSO
        console.log("SAML SSO - Coming Soon");
    };

    const handleSocialLogin = async (provider: 'google' | 'azure' | 'github' | 'linkedin' | string) => {
        setSocialLoading(provider);
        try {
            const options: any = {
                redirectTo: `${window.location.origin}/`,
            };

            if (provider === 'google') {
                options.queryParams = {
                    access_type: 'offline',
                    prompt: 'consent',
                };
            }

            if (provider === 'azure') {
                options.scopes = 'email profile openid offline_access User.Read';
            }

            const { error: socialError } = await supabase.auth.signInWithOAuth({
                provider: provider as any,
                options,
            });
            if (socialError) throw socialError;
        } catch (err: any) {
            setError(err.message || t('auth.errors.socialLoginFailed'));
            setSocialLoading(null);
        }
    };

    const handleMagicLinkLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError(t('auth.errors.enterEmail'));
            return;
        }
        if (!captchaToken) {
            setError(t('auth.errors.completeCaptcha'));
            return;
        }
        if (classifyEmailDomain(email) !== EmailType.PUBLIC) {
            setError(t('auth.errors.workEmailNotAllowed'));
            return;
        }
        setMagicLinkLoading(true);
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            let redirectTo = isLocalhost 
                ? ((import.meta as any).env.VITE_LOCALHOST_URL || window.location.origin)
                : window.location.origin;
            
            // Ensure no double slashes if env var has trailing slash
            redirectTo = redirectTo.replace(/\/$/, '');

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                    emailRedirectTo: `${redirectTo}/`,
                    captchaToken,
                }
            });
            if (error) throw error;

            if (isLocalhost) {
                // On localhost, open Inbucket to let the user click the link immediately
                window.open('http://localhost:54324', '_blank');
                return;
            }

            setMagicLinkSuccess(true);
        } catch (err: any) {
            setError(err.message || t('auth.errors.magicLinkFailed'));
        } finally {
            setMagicLinkLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError(t('auth.errors.enterEmailFirst'));
            return;
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        if (resetError) {
            setError(resetError.message);
        } else {
            alert(t('auth.errors.resetLinkSent'));
            setMagicLinkSuccess(true);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setPassword('');
        setShowPassword(false);
    };

    return {
        isRegistering,
        loading,
        socialLoading,
        email,
        setEmail,
        password,
        setPassword,
        displayName,
        setDisplayName,
        showPassword,
        setShowPassword,
        error,
        strength,
        generatePassword,
        handleSubmit,
        handleSocialLogin,
        handleLinkedInLogin,
        handleSamlLogin,
        handleForgotPassword,
        toggleMode,
        marketingConsent,
        setMarketingConsent,
        captchaToken,
        setCaptchaToken,
        magicLinkLoading,
        handleMagicLinkLogin,
        magicLinkSuccess,
        setMagicLinkSuccess,
        MOCK_USERS // Keep for UI compatibility if needed elsewhere
    };
};
