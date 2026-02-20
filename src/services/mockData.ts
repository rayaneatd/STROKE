
import {
    User, Role, SubscriptionPlan, BillingType, Project, ProjectId, UserId, FileId,
    ProjectRole, ProjectFile, ProjectBillingMode, ProjectMember, ProjectPermission,
    EmployeeAddPermission, DemoteTarget, UserPreferences,
    DashboardAnalytics, ProjectPerformanceRow, PricingPlan, ScanPackageConfig,
    ConnectionItem, ProjectMessage, ChannelType, OutreachStrategy
} from '../types';
import { logScanConsumed } from './polar-mock';

// --- MOCK DATABASE ---

export const MOCK_USERS: User[] = [
    {
        id: 'u1' as UserId,
        email: 'admin@airecruit.com',
        displayName: 'Admin User',
        role: Role.ADMIN,
        subscriptionPlan: SubscriptionPlan.ELITE,
        scansBalance: 1000,
        purchasedScans: 500,
        billingType: BillingType.POSTPAID,
        overageCap: 'UNLIMITED',
        emailIntegrations: [
            {
                id: 'email-1',
                provider: 'GMAIL',
                emailAddress: 'admin.work@company.com',
                isConnected: true,
                addedAt: '2023-01-01T00:00:00Z'
            }
        ],
        preferences: {
            defaultInvitationPermission: EmployeeAddPermission.ALL,
            defaultQuickDemoteTarget: 'VISITOR',
            defaultAnalystAccessOnlyForCompleted: false,
            defaultAdminCanChangeStatus: true,
            defaultAdminCanManageQuotas: true,
            defaultAnalystCanViewActivity: true,
            defaultAnalystCanUseGhosting: true,
            defaultScoutCanUseGhosting: false,
            defaultScanQuota: 'UNLIMITED',
            defaultBillingMode: 'OWNER_WALLET',
            defaultInvestmentBudget: 1000,
            defaultOutreachStrategy: OutreachStrategy.INDIVIDUAL_IDENTITY,
            defaultOwnerOutreachEmailId: 'email-1',
            autoArchiveProjects: false,
            compactMode: false,
            notifications: { email: true, push: true, digestFrequency: 'WEEKLY' },
            uiConfig: { theme: 'DARK', accentColor: 'blue', ambientGlow: 'blue', glassIntensity: 'MEDIUM', density: 'COMFORTABLE', reducedMotion: false }
        },
        signupDate: '2023-01-01T00:00:00Z',
        hasCompletedOnboarding: true
    },
    {
        id: 'u2' as UserId,
        email: 'user@company.com',
        displayName: 'John Doe',
        role: Role.USER,
        subscriptionPlan: SubscriptionPlan.PRO,
        scansBalance: 50,
        purchasedScans: 0,
        billingType: BillingType.PREPAID,
        overageCap: 0,
        emailIntegrations: [],
        preferences: {
            defaultInvitationPermission: EmployeeAddPermission.ALL,
            defaultQuickDemoteTarget: 'VISITOR',
            defaultAnalystAccessOnlyForCompleted: false,
            defaultAdminCanChangeStatus: false,
            defaultAdminCanManageQuotas: false,
            defaultAnalystCanViewActivity: true,
            defaultAnalystCanUseGhosting: false,
            defaultScoutCanUseGhosting: false,
            defaultScanQuota: 100,
            defaultBillingMode: 'OWNER_WALLET',
            defaultInvestmentBudget: 0,
            defaultOutreachStrategy: OutreachStrategy.INDIVIDUAL_IDENTITY,
            autoArchiveProjects: false,
            compactMode: false,
            notifications: { email: true, push: true, digestFrequency: 'WEEKLY' },
            uiConfig: { theme: 'LIGHT', accentColor: 'emerald', ambientGlow: 'emerald', glassIntensity: 'LOW', density: 'COMFORTABLE', reducedMotion: false }
        },
        signupDate: '2023-06-15T00:00:00Z',
        hasCompletedOnboarding: true
    }
];

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1' as ProjectId,
        title: 'Senior Frontend Engineer',
        description: 'React, TypeScript, Node.js',
        ownerId: 'u1' as UserId,
        createdAt: '2023-10-01T00:00:00Z',
        fileCount: 15,
        memberCount: 2,
        status: 'ACTIVE',
        settings: {
            employeeAddPermission: EmployeeAddPermission.ALL,
            quickDemoteTarget: 'VISITOR',
            analystAccessOnlyForCompleted: false,
            adminCanChangeStatus: true,
            adminCanManageQuotas: true,
            analystCanViewActivity: true,
            analystCanUseGhosting: true,
            scoutCanUseGhosting: false,
            defaultScanQuota: 'UNLIMITED',
            billingMode: 'OWNER_WALLET',
            outreachStrategy: OutreachStrategy.INDIVIDUAL_IDENTITY,
            ownerOutreachEmailId: 'email-1'
        },
        members: [
            { userId: 'u1' as UserId, role: ProjectRole.OWNER, permissions: ['SCAN', 'ANALYZE'], scansUsed: 10, scanQuota: 'UNLIMITED', joinedAt: '2023-10-01', preferredOutreachEmailId: 'email-1' },
            { userId: 'u2' as UserId, role: ProjectRole.EMPLOYEE, permissions: ['SCAN'], scansUsed: 5, scanQuota: 20, joinedAt: '2023-10-02' }
        ],
        investmentBalance: 0
    }
];

export const MOCK_FILES: ProjectFile[] = [
    {
        id: 'f1' as FileId,
        projectId: 'p1' as ProjectId,
        name: 'resume_alice.pdf',
        size: '1.2 MB',
        status: 'COMPLETED',
        uploadedAt: '2023-10-05T10:00:00Z',
        uploadedByUserId: 'u1' as UserId,
        candidateName: 'Alice Smith',
        score: 92,
        viewedBy: [],
        exportedBy: []
    },
    {
        id: 'f2' as FileId,
        projectId: 'p1' as ProjectId,
        name: 'resume_bob.pdf',
        size: '0.8 MB',
        status: 'COMPLETED',
        uploadedAt: '2023-10-06T14:30:00Z',
        uploadedByUserId: 'u2' as UserId,
        candidateName: 'Bob Jones',
        score: 78,
        viewedBy: [],
        exportedBy: []
    }
];

// --- AUTH SERVICES ---

export const login = (identifier: string, pass: string): User => {
    const user = MOCK_USERS.find(u => u.email === identifier);
    if (!user) throw new Error("Invalid credentials");
    if (user.isBanned) throw new Error("Account suspended");
    return user;
};

export const register = (email: string, pass: string, name: string): User => {
    if (MOCK_USERS.find(u => u.email === email)) throw new Error("Email already exists");
    const newUser: User = {
        id: `u${Date.now()}` as UserId,
        email,
        displayName: name,
        role: Role.USER,
        subscriptionPlan: SubscriptionPlan.FREE,
        scansBalance: 10,
        purchasedScans: 0,
        billingType: BillingType.PREPAID,
        overageCap: 0,
        emailIntegrations: [],
        preferences: {} as any, // Defaults handled in component or hook
        signupDate: new Date().toISOString(),
        hasCompletedOnboarding: false
    };
    MOCK_USERS.push(newUser);
    return newUser;
};

export const getUser = (id: string): User | undefined => MOCK_USERS.find(u => u.id === id);

export const updateUser = (id: string, data: Partial<User>): User => {
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...data };
    return MOCK_USERS[idx];
};

export const deleteUser = (id: string) => {
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx !== -1) MOCK_USERS.splice(idx, 1);
};

export const changePassword = (userId: string, old: string, newP: string) => {
    // Mock always true
    return true;
};

export const toggleUserBan = (userId: string, adminId: string, reason?: string, expiresAt?: string) => {
    const user = getUser(userId);
    if (user) {
        user.isBanned = !user.isBanned;
        if (user.isBanned) {
            user.banReason = reason;
            user.bannedBy = adminId;
            user.bannedAt = new Date().toISOString();
            user.banExpiresAt = expiresAt;
        } else {
            user.banReason = undefined;
            user.bannedBy = undefined;
            user.bannedAt = undefined;
            user.banExpiresAt = undefined;
        }
        return user;
    }
    return null;
};

// --- PROJECT SERVICES ---

export const updateProject = (id: string, data: Partial<Project>) => {
    const idx = MOCK_PROJECTS.findIndex(p => p.id === id);
    if (idx !== -1) {
        MOCK_PROJECTS[idx] = { ...MOCK_PROJECTS[idx], ...data };
    }
};

export const deleteProject = (id: string) => {
    const idx = MOCK_PROJECTS.findIndex(p => p.id === id);
    if (idx !== -1) {
        const p = MOCK_PROJECTS[idx];
        MOCK_PROJECTS.splice(idx, 1);
        return getUser(p.ownerId);
    }
    return null;
};

export const addProjectMember = (projectId: string, member: ProjectMember) => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    if (p) {
        p.members.push(member);
        p.memberCount++;
    }
};

export const removeProjectMember = (projectId: string, userId: string) => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    if (p) {
        p.members = p.members.filter(m => m.userId !== userId);
        p.memberCount = p.members.length;
    }
};

export const updateProjectMemberRole = (projectId: string, userId: string, role: ProjectRole) => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    if (p) {
        const m = p.members.find(mem => mem.userId === userId);
        if (m) m.role = role;
    }
};

export const updateMemberPermissions = (projectId: string, userId: string, perms: ProjectPermission[]) => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    if (p) {
        const m = p.members.find(mem => mem.userId === userId);
        if (m) m.permissions = perms;
    }
};

export const updateMemberQuota = (projectId: string, userId: string, quota: number | 'UNLIMITED') => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    if (p) {
        const m = p.members.find(mem => mem.userId === userId);
        if (m) m.scanQuota = quota;
    }
};

export const updateMemberPreferredEmail = (projectId: string, userId: string, emailId: string) => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    if (p) {
        const m = p.members.find(mem => mem.userId === userId);
        if (m) m.preferredOutreachEmailId = emailId;
    }
}

export const fundProject = (projectId: string, amount: number, userId: string) => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    const u = getUser(userId);
    if (p && u) {
        if (u.scansBalance < amount) return { success: false, error: 'Insufficient funds' };
        u.scansBalance -= amount;
        p.investmentBalance = (p.investmentBalance || 0) + amount;
        p.totalInvested = (p.totalInvested || 0) + amount;
        return { success: true, updatedProject: p, updatedUser: u };
    }
    return { success: false, error: 'Project or User not found' };
};

export const withdrawProjectFunds = (projectId: string, amount: number, userId: string) => {
    const p = MOCK_PROJECTS.find(proj => proj.id === projectId);
    const u = getUser(userId);
    if (p && u) {
        if ((p.investmentBalance || 0) < amount) return { success: false, error: 'Insufficient project funds' };
        p.investmentBalance = (p.investmentBalance || 0) - amount;
        u.scansBalance += amount;
        return { success: true, updatedProject: p, updatedUser: u };
    }
    return { success: false, error: 'Project or User not found' };
};

export const processScanTransaction = (projectId: string, userId: string, amount: number) => {
    const project = MOCK_PROJECTS.find(p => p.id === projectId);
    if (!project) return { success: false, error: 'Project not found' };

    const member = project.members.find(m => m.userId === userId);
    if (!member) return { success: false, error: 'Member not found' };

    // Check Member Quota
    if (member.scanQuota !== 'UNLIMITED' && member.scanQuota !== -1 && String(member.scanQuota) !== '-1' && (member.scansUsed + amount) > member.scanQuota) {
        return { success: false, error: 'Member quota exceeded' };
    }

    // Check Project/Owner Balance
    if (project.settings.billingMode === 'PROJECT_INVESTMENT') {
        if ((project.investmentBalance || 0) < amount) return { success: false, error: 'Project budget depleted' };
        project.investmentBalance = (project.investmentBalance || 0) - amount;
    } else {
        const owner = getUser(project.ownerId);
        if (!owner) return { success: false, error: 'Owner not found' };

        if (owner.billingType === BillingType.PREPAID) {
            if (owner.scansBalance < amount) return { success: false, error: 'Insufficient owner funds' };
            owner.scansBalance -= amount;
        } else {
            // Postpaid
            owner.scansBalance -= amount;
            const overage = owner.scansBalance < 0 ? Math.abs(owner.scansBalance) : 0;
            if (overage > 0) {
                if (owner.overageCap !== 'UNLIMITED' && overage > owner.overageCap) {
                    // Revert
                    owner.scansBalance += amount;
                    return { success: false, error: 'Overage cap reached' };
                }
                logScanConsumed(amount, owner.id, true);
            }
        }
        // Update user reference in MOCK_USERS handled by direct mutation above
    }

    member.scansUsed += amount;
    return { success: true, updatedProject: project, updatedUser: getUser(project.ownerId) };
};

export const notifyOwner = (ownerId: string, requesterId: string) => {
    // Mock notification
    console.log(`Notify owner ${ownerId} from ${requesterId}`);
};

// --- ANALYTICS & REPORTS ---

export interface AnalyticsOptions {
    timeRangeDays: number;
    projectStatus: string;
    ownerFilter: string;
    currentUserId: string;
}

export const getAdvancedDashboardAnalytics = (options: AnalyticsOptions): DashboardAnalytics => {
    // Mock analytics
    return {
        kpi: {
            totalCandidates: 1250,
            candidateTrend: '+12%',
            analyzedCount: 1200,
            qualifiedRate: 24,
            qualifiedTrend: '+5%',
            activeProjects: MOCK_PROJECTS.filter(p => p.status === 'ACTIVE').length,
            avgTimeProcessing: '1.2s',
            failedUploadsCount: 5
        },
        teamStats: {
            admins: 2,
            partners: 5,
            scouts: 3,
            analysts: 1
        },
        timelineData: [
            { date: 'Mon', applications: 40, avgQuality: 65 },
            { date: 'Tue', applications: 30, avgQuality: 70 },
            { date: 'Wed', applications: 55, avgQuality: 68 },
            { date: 'Thu', applications: 45, avgQuality: 72 },
            { date: 'Fri', applications: 60, avgQuality: 75 },
            { date: 'Sat', applications: 20, avgQuality: 60 },
            { date: 'Sun', applications: 15, avgQuality: 62 },
        ],
        errorData: [
            { name: 'Format', value: 2, fill: '#ef4444' },
            { name: 'Size', value: 1, fill: '#f59e0b' },
            { name: 'Corrupt', value: 2, fill: '#64748b' }
        ],
        projectPerformance: MOCK_PROJECTS.map(p => ({
            id: p.id,
            name: p.title,
            status: p.status,
            candidates: p.fileCount,
            qualified: Math.floor(p.fileCount * 0.3),
            avgScore: 72
        }))
    };
};

export const getProjectAnalytics = (projectId: string) => {
    return {
        total: 20,
        completed: 18,
        pending: 2,
        avgScore: 75,
        timelineData: []
    };
};

export const getAdminAnalytics = (users: User[]) => {
    return {
        financials: {
            arr: 120000,
            netMRR: 10000,
            grossMRR: 12000,
            netProfit: 5000,
            profitMargin: 42,
            ltv: 500,
            cac: 150,
            paybackPeriod: '3 months',
            arpu: 85
        },
        costs: {
            totalAiCost: 1500,
            infraCost: 800,
            tokenBurn: 5000000
        },
        geo: {
            revenue: [{ name: 'US', value: 6000 }, { name: 'EU', value: 3000 }],
            users: [{ name: 'US', value: 100 }, { name: 'EU', value: 50 }]
        },
        charts: {
            revenueHistory: [{ name: 'Jan', retained: 8000, new: 2000 }],
            cohorts: [{ month: 'Jan', initialSize: 50, retention: [100, 90, 85] }],
            planMix: []
        }
    };
};

export const generateReport = (format: string, type: string, id?: string) => {
    return `data:text/csv;charset=utf-8,Mock Report ${type} ${id || ''}`;
};

// --- FILE & COMMUNICATION ---

export const markCandidateContacted = (fileId: string, userId: string) => {
    const file = MOCK_FILES.find(f => f.id === fileId);
    if (file) {
        file.emailSentAt = new Date().toISOString();
        file.emailSentBy = userId;
        file.lastContactedAt = new Date().toISOString();
        file.emailDraft = undefined;
        return file;
    }
    return null;
};

export const saveCandidateDraft = (fileId: string, draft: string) => {
    const file = MOCK_FILES.find(f => f.id === fileId);
    if (file) file.emailDraft = draft;
};

export const generateAIEmailDraft = (name: string, score: number) => {
    return `Hi ${name},\n\nWe were impressed by your profile (Match: ${score}%). Would you be available for a chat?`;
};

export const markFileViewed = (fileId: string, userId: string) => {
    const file = MOCK_FILES.find(f => f.id === fileId);
    if (file) {
        if (!file.viewedBy) file.viewedBy = [];
        if (!file.viewedBy.includes(userId)) file.viewedBy.push(userId);
    }
};

export const markFileExported = (fileId: string, userId: string) => {
    const file = MOCK_FILES.find(f => f.id === fileId);
    if (file) {
        if (!file.exportedBy) file.exportedBy = [];
        if (!file.exportedBy.includes(userId)) file.exportedBy.push(userId);
    }
};

// --- CONNECTIONS ---

interface InternalConnection {
    id: string;
    senderId: UserId;
    receiverId: UserId;
    status: 'CONNECTED' | 'PENDING';
    date: string;
}

export const INTERNAL_CONNECTIONS: InternalConnection[] = [
    { id: 'c1', senderId: 'u1' as UserId, receiverId: 'u2' as UserId, status: 'CONNECTED', date: '2023-01-01' }
];

export const sendConnectionRequest = (fromId: UserId, toEmail: string) => {
    const targetUser = MOCK_USERS.find(u => u.email.toLowerCase() === toEmail.toLowerCase());

    if (!targetUser) {
        throw new Error("No user found with this email address.");
    }

    if (targetUser.id === fromId) {
        throw new Error("You cannot connect with yourself.");
    }

    const existing = INTERNAL_CONNECTIONS.find(c =>
        (c.senderId === fromId && c.receiverId === targetUser.id) ||
        (c.senderId === targetUser.id && c.receiverId === fromId)
    );

    if (existing) {
        if (existing.status === 'CONNECTED') throw new Error("You are already connected with this user.");
        if (existing.senderId === fromId) throw new Error("You have already sent a request to this user.");
        throw new Error("This user has already sent you a request.");
    }

    const newRequest: InternalConnection = {
        id: `conn-${Date.now()}`,
        senderId: fromId,
        receiverId: targetUser.id,
        status: 'PENDING',
        date: new Date().toISOString().split('T')[0]
    };

    INTERNAL_CONNECTIONS.push(newRequest);
    return "Request Sent Successfully";
};

export const fetchNetworkData = (userId: UserId) => {
    const connections: ConnectionItem[] = [];
    const received: ConnectionItem[] = [];
    const sent: ConnectionItem[] = [];

    INTERNAL_CONNECTIONS.forEach(c => {
        if (c.status === 'CONNECTED') {
            if (c.senderId === userId || c.receiverId === userId) {
                const otherId = c.senderId === userId ? c.receiverId : c.senderId;
                const otherUser = getUser(otherId);
                if (otherUser) {
                    connections.push({ id: c.id, otherUser, status: 'CONNECTED', date: c.date });
                }
            }
        } else if (c.status === 'PENDING') {
            if (c.senderId === userId) {
                const otherUser = getUser(c.receiverId);
                if (otherUser) {
                    sent.push({ id: c.id, otherUser, status: 'SENT', date: c.date });
                }
            } else if (c.receiverId === userId) {
                const otherUser = getUser(c.senderId);
                if (otherUser) {
                    received.push({ id: c.id, otherUser, status: 'RECEIVED', date: c.date });
                }
            }
        }
    });

    return { connections, received, sent };
};

export const updateConnectionStatus = (id: string, action: 'ACCEPT' | 'DECLINE' | 'CANCEL' | 'REMOVE') => {
    const idx = INTERNAL_CONNECTIONS.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Connection not found");

    const conn = INTERNAL_CONNECTIONS[idx];

    switch (action) {
        case 'ACCEPT':
            conn.status = 'CONNECTED';
            conn.date = new Date().toISOString().split('T')[0];
            break;
        case 'DECLINE':
        case 'CANCEL':
        case 'REMOVE':
            INTERNAL_CONNECTIONS.splice(idx, 1);
            break;
    }
};

// --- MESSAGING ---

export const getProjectMessages = (projectId: string, channel: ChannelType, limit: number, before?: string) => {
    return { messages: [], hasMore: false };
};

export const sendProjectMessage = (projectId: string, channel: ChannelType, content: string, senderId: string): ProjectMessage => {
    return {
        id: `msg-${Date.now()}`,
        projectId: projectId as ProjectId,
        channel,
        senderId: senderId as UserId,
        content,
        timestamp: new Date().toISOString(),
        isEncrypted: false
    };
};

// --- PRICING ---

export const getSubscriptionPlans = (): PricingPlan[] => [
    { id: SubscriptionPlan.FREE, name: 'Starter', price: 0, period: '/mo', description: 'Basic access', features: ['10 Scans'], monthlyScans: 10, maxProjects: 1, maxMembers: 1, colorTheme: 'slate', allowOverage: false },
    { id: SubscriptionPlan.PRO, name: 'Pro', price: 49, period: '/mo', description: 'For professionals', features: ['500 Scans', 'Unlimited Projects'], monthlyScans: 500, maxProjects: 'UNLIMITED', maxMembers: 5, colorTheme: 'blue', allowOverage: true, recommended: true },
    { id: SubscriptionPlan.TEAM, name: 'Team', price: 199, period: '/mo', description: 'For growing teams', features: ['2500 Scans', 'Unlimited Projects'], monthlyScans: 2500, maxProjects: 'UNLIMITED', maxMembers: 20, colorTheme: 'purple', allowOverage: true },
    { id: SubscriptionPlan.ELITE, name: 'Elite', price: 500, period: '/mo', description: 'Enterprise-grade power', features: ['Custom Scans', 'Dedicated Support'], monthlyScans: 10000, maxProjects: 'UNLIMITED', maxMembers: 'UNLIMITED', colorTheme: 'amber', allowOverage: true },
    { id: SubscriptionPlan.ESSENTIAL, name: 'Essential', price: 19, period: '/mo', description: 'For individuals', features: ['50 Scans', '3 Projects'], monthlyScans: 50, maxProjects: 3, maxMembers: 1, colorTheme: 'emerald', allowOverage: false }
];

export const updateSubscriptionPlan = (id: string, data: any) => { };

export const getScanPackages = (): ScanPackageConfig[] => [
    { id: 'pkg1', name: 'Starter Pack', scans: 50, price: 15, features: [], colorTheme: 'blue' },
    { id: 'pkg2', name: 'Growth Pack', scans: 200, price: 50, features: [], colorTheme: 'purple', isPopular: true },
    { id: 'pkg3', name: 'Enterprise Pack', scans: 1000, price: 200, features: [], colorTheme: 'amber' }
];

export const updateScanPackage = (id: string, data: any) => { };
