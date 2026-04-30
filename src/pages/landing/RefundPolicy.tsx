import React from 'react';
import InfoPageWrapper from '../../components/InfoPageWrapper';

const RefundPolicy: React.FC = () => {
    return (
        <InfoPageWrapper>
            <div className="max-w-4xl mx-auto w-full space-y-16">
                <header className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white italic">
                        Refund <br /> Policy.
                    </h1>
                    <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
                        Last Updated: April 30, 2026
                    </p>
                    <div className="h-px w-full bg-gradient-to-r from-blue-500/50 to-transparent" />
                </header>

                <div className="prose prose-invert max-w-none space-y-12 text-zinc-400 leading-relaxed">
                    <section>
                        <p className="text-lg">
                            At STROKE ("we," "our," or "us"), we are committed to providing a high-quality AI-driven recruitment platform. This Refund Policy outlines the circumstances under which refunds may be granted for our credit-based services and subscription plans.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">1. How Credits Work</h2>
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-2">
                            <p><strong className="text-zinc-200">Scan Credits:</strong> Each resume scan consumes a set number of credits from your balance.</p>
                            <p><strong className="text-zinc-200">Automatic Refund on Error:</strong> If a scan fails due to a technical error on our end, the consumed credits are automatically restored to your account balance.</p>
                            <p><strong className="text-zinc-200">Contact:</strong> contact.rayaneatd@gmail.com</p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">2. Eligible Refund Scenarios</h2>
                        <p>Refunds or credit restorations are granted in the following situations:</p>
                        <ul className="list-disc pl-6 space-y-4">
                            <li><strong className="text-zinc-300">Technical Platform Failure:</strong> A scan or core feature failed to complete due to a confirmed bug or outage on STROKE's infrastructure.</li>
                            <li><strong className="text-zinc-300">Duplicate Charge:</strong> You were charged more than once for the same transaction due to a payment processing error.</li>
                            <li><strong className="text-zinc-300">Service Unavailability:</strong> Significant, prolonged service downtime that prevented you from utilizing your purchased plan during your billing period.</li>
                            <li><strong className="text-zinc-300">Legal Requirement:</strong> A refund is mandated by applicable consumer protection law in your jurisdiction.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">3. Non-Refundable Cases</h2>
                        <p>The following situations are generally not eligible for a monetary refund:</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse bg-zinc-900/30 rounded-xl overflow-hidden">
                                <thead>
                                    <tr className="bg-zinc-800/50 text-zinc-200">
                                        <th className="p-4 border-b border-zinc-700">Scenario</th>
                                        <th className="p-4 border-b border-zinc-700">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr>
                                        <td className="p-4 border-b border-zinc-800">Credits already consumed for completed scans</td>
                                        <td className="p-4 border-b border-zinc-800">The AI analysis service has been rendered</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 border-b border-zinc-800">Change of mind after a plan purchase</td>
                                        <td className="p-4 border-b border-zinc-800">Subscriptions and credit bundles are non-reversible once activated</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 border-b border-zinc-800">Unused credits at end of a billing cycle</td>
                                        <td className="p-4 border-b border-zinc-800">Credits roll over; no expiry-based refunds are issued</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Account suspension due to Terms of Service violation</td>
                                        <td className="p-4">Refunds are forfeited upon confirmed violations</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">4. Subscription Cancellations</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-zinc-300">Cancellation Timing:</strong> You may cancel your subscription at any time from your account settings.</li>
                            <li><strong className="text-zinc-300">Access Until Period End:</strong> Upon cancellation, you retain full access to STROKE until the end of your current paid billing period.</li>
                            <li><strong className="text-zinc-300">No Prorated Refunds:</strong> We do not issue prorated refunds for the remaining days of a cancelled subscription period.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">5. How to Request a Refund</h2>
                        <p className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
                            <strong className="text-blue-400">To submit a refund request,</strong> please contact our support team at <strong className="text-zinc-200">contact.rayaneatd@gmail.com</strong> with your account email, a description of the issue, and the relevant transaction or scan ID. We will review and respond within <strong className="text-zinc-200">3–5 business days.</strong>
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white italic border-l-4 border-blue-500 pl-6">6. Refund Window</h2>
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-2">
                            <p><strong className="text-zinc-200">Time Limit:</strong> All refund requests must be submitted within <strong className="text-zinc-200">14 days</strong> of the original transaction date.</p>
                            <p><strong className="text-zinc-200">Processing Time:</strong> Approved refunds will be credited back to the original payment method within 5–10 business days, depending on your bank or card issuer.</p>
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-zinc-800 space-y-4">
                        <p className="text-sm text-zinc-500 italic">
                            Note: This policy may be updated as STROKE's pricing and credit systems evolve. We recommend checking this page periodically for any changes.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 uppercase tracking-widest">
                            <span>Security Protocol: v2.1.4_R</span>
                            <span>•</span>
                            <span>GDPR Compliant Architecture</span>
                        </div>
                    </footer>
                </div>
            </div>
        </InfoPageWrapper>
    );
};

export default RefundPolicy;
