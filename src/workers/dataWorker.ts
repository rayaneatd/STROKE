
// This string contains the entire worker logic.
// We use this pattern to avoid ejecting CRA or complex webpack config for this demo.
export const workerCode = `
self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'FILTER_FILES':
            filterFiles(payload);
            break;
        case 'CALCULATE_ANALYTICS':
            calculateAnalytics(payload);
            break;
        default:
            console.warn('Unknown worker message type:', type);
    }
};

function filterFiles({ files, query, minScore }) {
    const lowerQuery = query ? query.toLowerCase() : '';
    
    // Performance: Loop once
    const filtered = files.filter(f => {
        const matchesSearch = !lowerQuery || 
            (f.name && f.name.toLowerCase().includes(lowerQuery)) ||
            (f.candidateName && f.candidateName.toLowerCase().includes(lowerQuery));
            
        const matchesScore = minScore === undefined || (f.score || 0) >= minScore;
        
        return matchesSearch && matchesScore;
    });

    self.postMessage({ type: 'FILTER_FILES_RESULT', payload: filtered });
}

function calculateAnalytics({ projects, files }) {
    // Expensive aggregation logic
    const totalFiles = files.length;
    const completed = files.filter(f => f.status === 'COMPLETED').length;
    const avgScore = completed > 0 
        ? Math.round(files.reduce((acc, curr) => acc + (curr.score || 0), 0) / completed)
        : 0;

    self.postMessage({ type: 'ANALYTICS_RESULT', payload: { totalFiles, completed, avgScore } });
}
`;
