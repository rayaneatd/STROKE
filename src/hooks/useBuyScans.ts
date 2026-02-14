import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getScanPackages } from '../services/mockData';
import { ScanPackage } from '../components/cards/ScanPackageCard';

interface UseBuyScansProps {
    onBack: () => void;
    onBuy: (amount: number) => void;
}

export const useBuyScans = ({ onBack, onBuy }: UseBuyScansProps) => {
    const { isLight, styles } = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const [packages, setPackages] = useState<ScanPackage[]>([]);

    useEffect(() => {
        setPackages(getScanPackages() as ScanPackage[]);
    }, []);

    const handlePurchase = (amount: number) => {
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            onBuy(amount);
            setIsProcessing(false);
            onBack();
        }, 1500);
    };

    return {
        isLight,
        styles,
        isProcessing,
        packages,
        handlePurchase
    };
};
