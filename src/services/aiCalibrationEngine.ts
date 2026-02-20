import { Project, User, SubscriptionPlan, ProjectBillingMode } from '../types';
import { MOCK_FILES } from './mockData';

export interface CalibrationResult {
    healthScore: number; // 0 to 100
    metrics: {
        dailyVelocity: number;
        peakVelocity: number;
        burnRate: number; // Scans per day
        projectedMonthlyUsage: number;
        usageVariance: number; // For member quota logic
        runwayDays: number | 'INFINITE';
    };
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    recommendations: {
        billingMode: ProjectBillingMode;
        budget: number;
        quota: number | 'UNLIMITED';
        reasoning: { icon: string; text: string; impact: string }[];
    }
}

/**
 * PRODUCTION-GRADE CALIBRATION ENGINE
 * Uses statistical analysis of historical data to forecast needs.
 */
export const runProjectDiagnostics = (project: Project, owner: User): CalibrationResult => {
    // 1. DATA AGGREGATION
    const projectFiles = MOCK_FILES.filter(f => f.projectId === project.id);
    const sortedFiles = [...projectFiles].sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
    
    // Member usage map
    const memberUsage = new Map<string, number>();
    project.members.forEach(m => memberUsage.set(m.userId, m.scansUsed));
    const usages = Array.from(memberUsage.values());

    // 2. TIME-SERIES ANALYSIS (Last 30 Days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentFiles = sortedFiles.filter(f => new Date(f.uploadedAt) >= thirtyDaysAgo);
    
    // Calculate Velocity (Weighted Moving Average could be applied here, using simple avg for now)
    const activeDays = Math.max(1, (now.getTime() - new Date(project.createdAt).getTime()) / (1000 * 3600 * 24));
    const dailyVelocity = recentFiles.length / Math.min(30, activeDays);
    
    // Detect Peaks (Bursts)
    const uploadsByDay = new Map<string, number>();
    recentFiles.forEach(f => {
        const date = f.uploadedAt.split('T')[0];
        uploadsByDay.set(date, (uploadsByDay.get(date) || 0) + 1);
    });
    const peakVelocity = Math.max(0, ...Array.from(uploadsByDay.values()));

    // 3. STATISTICAL QUOTA CALCULATION
    // Calculate Mean and Standard Deviation of member usage to find outliers
    const meanUsage = usages.reduce((a, b) => a + b, 0) / Math.max(1, usages.length);
    const variance = usages.reduce((a, b) => a + Math.pow(b - meanUsage, 2), 0) / Math.max(1, usages.length);
    const stdDev = Math.sqrt(variance);

    // 4. FORECASTING
    // Projected usage = (Daily Velocity * 30) + (Growth Factor 1.1)
    const projectedMonthlyUsage = Math.ceil(dailyVelocity * 30 * 1.1);
    
    // Runway Calculation (if budget exists)
    let runwayDays: number | 'INFINITE' = 'INFINITE';
    if (project.settings.billingMode === 'PROJECT_INVESTMENT' && dailyVelocity > 0) {
        runwayDays = Math.floor((project.investmentBalance || 0) / dailyVelocity);
    }

    // 5. RECOMMENDATION ENGINE
    const recommendations = {
        billingMode: project.settings.billingMode,
        budget: project.investmentBalance || 0,
        quota: project.settings.defaultScanQuota,
        reasoning: [] as { icon: string; text: string; impact: string }[]
    };

    // A. Billing Mode Logic
    const canInvest = owner.subscriptionPlan !== SubscriptionPlan.ESSENTIAL;
    
    if (canInvest) {
        if (project.settings.billingMode === 'OWNER_WALLET') {
            // Recommendation: Switch to Investment if usage is high or multiple active members
            if (dailyVelocity > 2 || project.members.length > 3) {
                recommendations.billingMode = 'PROJECT_INVESTMENT';
                recommendations.reasoning.push({
                    icon: 'Wallet',
                    text: `High daily velocity (${dailyVelocity.toFixed(1)} scans/day).`,
                    impact: "Switching to Dedicated Budget prevents draining the main wallet."
                });
            }
        } else {
            // Already Investment Mode: Check Runway
            if (typeof runwayDays === 'number' && runwayDays < 7) {
                recommendations.reasoning.push({
                    icon: 'AlertTriangle',
                    text: `Critical Runway: ${runwayDays} days remaining.`,
                    impact: "Increase budget to avoid service interruption."
                });
            }
        }
    }

    // B. Budget Logic
    // Suggested Budget = Projected Usage + Buffer (20%)
    // If current balance is > 50% of projected, don't ask for more.
    const idealBudget = Math.ceil(projectedMonthlyUsage * 1.2);
    
    if (recommendations.billingMode === 'PROJECT_INVESTMENT') {
        if (project.investmentBalance < (idealBudget * 0.5)) {
            recommendations.budget = idealBudget;
            recommendations.reasoning.push({
                icon: 'TrendingUp',
                text: `Projected monthly consumption is ${projectedMonthlyUsage} scans.`,
                impact: `Setting budget to ${idealBudget} ensures 30 days of uninterrupted operation.`
            });
        }
    }

    // C. Quota Logic
    // If variance is high (some members use 100, others 5), set quota to Mean + 1 StdDev
    // This covers "normal" high usage but stops abuse.
    const canQuota = owner.subscriptionPlan === SubscriptionPlan.TEAM || owner.subscriptionPlan === SubscriptionPlan.ELITE;
    
    if (canQuota) {
        if (stdDev > 20 || peakVelocity > 50) {
            // Outliers detected
            const suggestedQuota = Math.ceil(meanUsage + stdDev);
            const safeQuota = Math.max(20, Math.ceil(suggestedQuota / 10) * 10); // Round to nearest 10, min 20

            const currentQuota = (project.settings.defaultScanQuota === -1 || String(project.settings.defaultScanQuota) === '-1') ? 'UNLIMITED' : project.settings.defaultScanQuota;
            
            if (currentQuota === 'UNLIMITED' || (typeof currentQuota === 'number' && currentQuota > safeQuota * 1.5)) {
                recommendations.quota = safeQuota;
                recommendations.reasoning.push({
                    icon: 'Users',
                    text: `Usage variance detected (StdDev: ${stdDev.toFixed(1)}).`,
                    impact: `Setting member quota to ${safeQuota} contains outliers while allowing normal work.`
                });
            }
        } else if (dailyVelocity < 1 && project.members.length < 5) {
            // Low usage, trusted team
            if (project.settings.defaultScanQuota !== 'UNLIMITED' && project.settings.defaultScanQuota !== -1 && String(project.settings.defaultScanQuota) !== '-1') {
                recommendations.quota = 'UNLIMITED';
                recommendations.reasoning.push({
                    icon: 'CheckCircle',
                    text: "Team activity is stable and low volume.",
                    impact: "Removing quotas reduces friction for the team."
                });
            }
        }
    }

    // 6. HEALTH SCORING
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    let healthScore = 100;

    if (typeof runwayDays === 'number' && runwayDays < 3) {
        riskLevel = 'CRITICAL';
        healthScore -= 40;
    } else if (typeof runwayDays === 'number' && runwayDays < 7) {
        riskLevel = 'HIGH';
        healthScore -= 20;
    } else if (variance > 100 && (project.settings.defaultScanQuota === 'UNLIMITED' || project.settings.defaultScanQuota === -1 || String(project.settings.defaultScanQuota) === '-1')) {
        riskLevel = 'MODERATE';
        healthScore -= 15;
    }

    // Ensure we don't recommend a budget lower than current if it's fine
    if (recommendations.budget < project.investmentBalance) {
        recommendations.budget = project.investmentBalance;
    }

    return {
        healthScore,
        riskLevel,
        metrics: {
            dailyVelocity: parseFloat(dailyVelocity.toFixed(1)),
            peakVelocity,
            burnRate: parseFloat(dailyVelocity.toFixed(1)),
            projectedMonthlyUsage,
            usageVariance: parseFloat(stdDev.toFixed(1)),
            runwayDays
        },
        recommendations
    };
};