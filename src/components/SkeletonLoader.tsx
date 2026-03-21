
import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
    const { isLight } = useTheme();

    const baseClass = isLight
        ? 'bg-slate-200 animate-pulse'
        : 'bg-white/5 animate-pulse';

    const variantClass = {
        text: 'h-4 w-full rounded',
        rect: 'w-full h-full rounded-xl',
        circle: 'rounded-full'
    }[variant];

    return <div className={`${baseClass} ${variantClass} ${className}`} />;
};

export const ProjectCardSkeleton = () => {
    const { isLight } = useTheme();
    return (
        <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'} space-y-4`}>
            <div className="flex justify-between items-start">
                <Skeleton variant="rect" className="w-20 h-5 rounded-full" />
                <Skeleton variant="circle" className="w-8 h-8" />
            </div>
            <Skeleton variant="text" className="h-6 w-3/4" />
            <Skeleton variant="text" className="h-3 w-1/3" />
            <div className="space-y-2 pt-2">
                <Skeleton variant="text" className="h-3 w-full" />
                <Skeleton variant="text" className="h-3 w-5/6" />
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex gap-4">
                    <Skeleton variant="rect" className="w-10 h-4" />
                    <Skeleton variant="rect" className="w-10 h-4" />
                </div>
                <Skeleton variant="rect" className="w-16 h-4" />
            </div>
        </div>
    );
};

export const CandidateRowSkeleton = () => {
    const { isLight } = useTheme();
    return (
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'} flex items-center gap-4`}>
            <Skeleton variant="rect" className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="h-4 w-1/4" />
                <Skeleton variant="text" className="h-3 w-1/2" />
            </div>
            <Skeleton variant="rect" className="w-20 h-6 rounded-full" />
            <Skeleton variant="rect" className="w-12 h-6 rounded-lg" />
            <Skeleton variant="circle" className="w-8 h-8 shrink-0" />
        </div>
    );
};

export const DashboardSkeleton = () => {
    const { isLight } = useTheme();
    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Skeleton */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton variant="text" className="h-8 w-48" />
                    <Skeleton variant="text" className="h-4 w-64" />
                </div>
                <Skeleton variant="rect" className="h-10 w-full xl:w-96 rounded-xl" />
            </div>

            {/* KPI Row Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'} h-32 space-y-4`}>
                        <div className="flex justify-between items-start">
                            <Skeleton variant="rect" className="w-8 h-8 rounded-lg" />
                            <Skeleton variant="rect" className="w-12 h-5 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton variant="text" className="h-6 w-1/2" />
                            <Skeleton variant="text" className="h-3 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Stats Skeleton */}
            <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'}`}>
                <Skeleton variant="text" className="h-4 w-32 mb-6" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton variant="text" className="h-5 w-1/2" />
                                <Skeleton variant="text" className="h-3 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'} h-[400px]`}>
                    <div className="flex justify-between mb-8">
                        <div className="space-y-2">
                            <Skeleton variant="text" className="h-6 w-48" />
                            <Skeleton variant="text" className="h-4 w-64" />
                        </div>
                        <div className="flex gap-4">
                            <Skeleton variant="rect" className="w-16 h-4" />
                            <Skeleton variant="rect" className="w-16 h-4" />
                        </div>
                    </div>
                    <Skeleton variant="rect" className="h-[280px] w-full" />
                </div>
                <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5'} h-[400px] flex flex-col items-center justify-center`}>
                    <Skeleton variant="circle" className="w-48 h-48 mb-6" />
                    <div className="space-y-2 w-full px-4">
                        <Skeleton variant="text" className="h-4 w-full" />
                        <Skeleton variant="text" className="h-4 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProjectDetailSkeleton = () => {
    const { isLight } = useTheme();
    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
            <div className="flex items-start gap-4 mb-6">
                <Skeleton variant="circle" className="w-10 h-10 mt-1 shrink-0" />
                <div className="flex-1 space-y-4 min-w-0">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="text" className="h-8 w-64" />
                        <Skeleton variant="rect" className="w-16 h-5 rounded-full" />
                    </div>
                </div>
            </div>

            <div className={`border-b flex gap-6 pb-3 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} variant="text" className="h-4 w-20" />
                ))}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton variant="rect" className="h-64 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton variant="rect" className="h-32 w-full" />
                        <Skeleton variant="rect" className="h-32 w-full" />
                    </div>
                </div>
                <div className="space-y-6">
                    <Skeleton variant="rect" className="h-48 w-full" />
                    <Skeleton variant="rect" className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
};
