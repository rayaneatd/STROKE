
import { ProjectFile, Project, User } from '../types';
import { updateProject, MOCK_FILES, getUser } from './mockData';

/**
 * Simulates backend processing of a single file.
 * Returns the updated file object.
 */
export const processFileOnBackend = async (
    file: ProjectFile, 
    projectId: string,
    currentUser: User
): Promise<ProjectFile> => {
    // 1. Simulate network/processing latency (randomized)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 400));

    // 2. Simulate Failure Chance (10%)
    const isSuccess = Math.random() > 0.1; 

    if (!isSuccess) {
        return {
            ...file,
            status: 'FAILED',
            failureReasons: [['Parsing Timeout', 'Corrupted Header', 'Unsupported Format'][Math.floor(Math.random() * 3)]]
        };
    }

    // 3. Simulate Success
    const score = Math.floor(Math.random() * 60 + 40); // 40-100
    return {
        ...file,
        status: 'COMPLETED',
        score: score,
        candidateName: `Candidate ${Math.floor(Math.random() * 10000)}`,
        // Reset markers on successful re-process
        emailSentAt: undefined,
        emailDraft: undefined
    };
};

/**
 * Updates project stats in the "database".
 */
export const updateProjectStatsOnBackend = (project: Project, successCount: number, userId: string) => {
    const updatedMembers = project.members.map(m => 
        m.userId === userId ? { ...m, scansUsed: m.scansUsed + successCount } : m
    );
    
    let newInvestBalance = project.investmentBalance;
    if (project.settings.billingMode === 'PROJECT_INVESTMENT') {
        newInvestBalance = Math.max(0, (newInvestBalance || 0) - successCount);
    }

    // Persist to mock DB
    updateProject(project.id, { 
        members: updatedMembers, 
        investmentBalance: newInvestBalance 
    });

    return { updatedMembers, newInvestBalance };
};
