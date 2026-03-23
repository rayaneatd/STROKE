import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getScanPackages } from '../services/mockData';
import { ScanPackage } from '../components/cards/ScanPackageCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UseBuyScansProps {
    onBack: () => void;
    onBuy: (amount: number) => void;
}

export const useBuyScans = ({ onBack, onBuy }: UseBuyScansProps) => {
    const { isLight, styles } = useTheme();
    const { user, refreshUser } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [packages, setPackages] = useState<ScanPackage[]>([]);

    useEffect(() => {
        setPackages(getScanPackages() as ScanPackage[]);
    }, []);

    const handlePurchase = async (amount: number, price: number = 0) => {
        if (!user) return;

        setIsProcessing(true);
        try {
            const { data, error } = await supabase.rpc('purchase_scans', {
                p_user_id: user.id,
                p_amount: amount,
                p_price: price
            });

            if (error) throw error;

            // The RPC now returns the new total integer balance directly
            const newTotalBalance = data as unknown as number;

            // Update local state and context
            // onBuy(amount) is mostly for secondary side effects now
            onBuy(amount);
            if (refreshUser) {
                await refreshUser();
            }

            onBack();
        } catch (err) {
            console.error('Purchase error:', err);
            // Optionally show error toast here
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        isLight,
        styles,
        isProcessing,
        packages,
        handlePurchase,
        user
    };
};
