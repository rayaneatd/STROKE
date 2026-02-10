import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as authLogin, register, MOCK_USERS } from '../services/mockData';
import { User } from '../types';

export const useLogin = () => {
    const { login } = useAuth();
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

    const handleLoginSuccess = (user: User) => {
        login(user);
        navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            try {
                let user: User;
                if (isRegistering) {
                    if (!displayName) throw new Error("Name is required");
                    user = register(email, password, displayName, phoneNumber);
                } else {
                    user = authLogin(email, password);
                }
                handleLoginSuccess(user);
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred");
                setLoading(false);
            }
        }, 500);
    };

    const handleSocialLogin = (provider: string) => {
        setSocialLoading(provider);
        setTimeout(() => {
            // Mock Social Login - just pick the first user or create one
            const mockUser = MOCK_USERS[0];
            handleLoginSuccess(mockUser);
        }, 1500);
    };

    const handleForgotPassword = () => {
        // Mock forgot password flow
        alert("Reset link sent to your email (Demo Mode).");
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setPassword('');
        setPhoneNumber('');
        setShowPassword(false);
    };

    const handleQuickLogin = (user: User) => {
        handleLoginSuccess(user);
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
        handleQuickLogin,
        MOCK_USERS // Expose for debug login
    };
};
