
// --- POLAR MOCK SERVICE ---
// Simulates events sent to Polar.sh or similar usage-based billing platforms.
// This handles the "Serein" mode (Pay-as-you-go) tracking logic.

export const logScanConsumed = (amount: number, userId: string, isOverage: boolean) => {
    const timestamp = new Date().toISOString();
    
    // Only log prominently if it's an overage event (negative balance usage)
    if (isOverage) {
        console.group('%c 🐻 [POLAR.SH METER EVENT] - Overage Detected', 'background: #0ea5e9; color: white; padding: 4px; border-radius: 4px;');
        console.log(`User ID: ${userId}`);
        console.log(`Amount: ${amount} scans`);
        console.log(`Timestamp: ${timestamp}`);
        console.log(`Status: BILLABLE_OVERAGE`);
        console.log(`Action: Event sent to Polar.sh Meter API`);
        console.groupEnd();
    } else {
        // Standard logging for internal tracking
        console.debug(`[Polar Mock] Standard usage logged: ${amount} for ${userId}`);
    }
};

export const logPlanSelected = (planId: string, userId: string) => {
    const timestamp = new Date().toISOString();
    console.log(
        `%c[POLAR MOCK] Event: subscription_updated`, 
        'background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
        {
            userId,
            planId,
            timestamp
        }
    );
};
