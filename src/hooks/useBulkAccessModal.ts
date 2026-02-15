import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { DemoteTarget } from '../types';

export interface UseBulkAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onConfirm: (target: DemoteTarget) => void;
}

export const useBulkAccessModal = ({
    isOpen,
    onClose,
    selectedCount,
    onConfirm
}: UseBulkAccessModalProps) => {
    const { isLight, accent } = useTheme();
    const [selectedRole, setSelectedRole] = useState<DemoteTarget>('PARTNER');

    const handleConfirm = () => {
        onConfirm(selectedRole);
        onClose();
    };

    return {
        selectedRole,
        setSelectedRole,
        handleConfirm,
        isLight,
        accent
    };
};
