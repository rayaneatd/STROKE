import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MOCK_USERS } from '../services/mockData';

export const useLogin = () => {
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

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
            if (isRegistering) {
                if (!displayName) throw new Error("Name is required");

                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: displayName,
                            phone_number: phoneNumber
                        }
                    }
                });

                if (signUpError) throw signUpError;
                alert("Please check your email for the confirmation link!");
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: any) => {
        setSocialLoading(provider);
        try {
            const { error: socialError } = await supabase.auth.signInWithOAuth({
                provider,
            });
            if (socialError) throw socialError;
        } catch (err: any) {
            setError(err.message || "Social login failed");
            setSocialLoading(null);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email address first");
            return;
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) {
            setError(resetError.message);
        } else {
            alert("Reset link sent to your email.");
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setPassword('');
        setPhoneNumber('');
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
        phoneNumber,
        setPhoneNumber,
        showPassword,
        setShowPassword,
        error,
        strength,
        generatePassword,
        handleSubmit,
        handleSocialLogin,
        handleForgotPassword,
        toggleMode,
        MOCK_USERS // Keep for UI compatibility if needed elsewhere
    };
};
