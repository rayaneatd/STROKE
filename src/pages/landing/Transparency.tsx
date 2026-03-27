import React from 'react';
import { Shield, Sparkles, Scale, BookOpen, AlertCircle, PlayCircle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InfoPageWrapper from '../../components/InfoPageWrapper';

const Transparency = () => {
    const { t } = useTranslation();

    return (
        <InfoPageWrapper>
            <div className="w-full max-w-4xl mx-auto space-y-16">

                <header className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium mb-4">
                        <Shield className="w-3.5 h-3.5" />
                        AI Act Transparency & Compliance
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                        How STROKE AI Works.
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Clear, transparent documentation of our AI models, scoring mechanisms, and human oversight guarantees.
                    </p>
                </header>

                <section className="space-y-6 pt-10">
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-white">
                        <Sparkles className="text-blue-500" />
                        1. Role of AI in STROKE
                    </h2>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4 text-zinc-300 leading-relaxed">
                        <p>
                            STROKE is designed as an <strong>assistive tool for recruiters</strong>, not an autonomous decision-making system. Our AI serves to accelerate the reading and preliminary sorting of resumes.
                        </p>
                        <p>
                            <strong>We sort, we never filter.</strong> Every candidate submitted is analyzed and remains visible to the recruiter. No candidate is automatically rejected by the AI. The final hiring decision always rests entirely with the human recruiter.
                        </p>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-white">
                        <Scale className="text-emerald-500" />
                        2. How the Score is Calculated
                    </h2>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 text-zinc-300 leading-relaxed">
                        <p>
                            The "Match Score" provided by STROKE is completely transparent. It is not an arbitrary number but the strict sum of four dimensions strictly anchored to your job description:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                <h4 className="font-semibold text-white mb-1">Technical Skills (0-40)</h4>
                                <p className="text-sm">Presence of hard skills explicitly requested in the job description.</p>
                            </div>
                            <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                <h4 className="font-semibold text-white mb-1">Experience (0-30)</h4>
                                <p className="text-sm">Quantity of years and relevance of the sector for the open position.</p>
                            </div>
                            <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                <h4 className="font-semibold text-white mb-1">Education (0-15)</h4>
                                <p className="text-sm">Appropriate degrees, training or certifications.</p>
                            </div>
                            <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                                <h4 className="font-semibold text-white mb-1">Soft Skills (0-15)</h4>
                                <p className="text-sm">Soft skills identifiable strictly based on the text structure and content.</p>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-400 mt-4 border-l-2 border-amber-500/50 pl-4">
                            The AI highlights gaps ("Missing Points" and "Red Flags") strictly when a requirement present in the job description is absent from the resume. It does not penalize based on assumptions.
                        </p>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-white">
                        <AlertCircle className="text-amber-500" />
                        3. Anti-Discrimination Built-in
                    </h2>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4 text-zinc-300 leading-relaxed">
                        <p>
                            Our analysis Engine is strictly programmed with fundamental anti-discrimination rules. STROKE ignores and will never infer:
                        </p>
                        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-4">
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Age</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Gender</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Ethnicity</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Nationality</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Religion</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Disability</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Family Status</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Health Status</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-white">
                        <Eye className="text-purple-500" />
                        4. Human Oversight (Art. 14)
                    </h2>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4 text-zinc-300 leading-relaxed">
                        <p>
                            In accordance with Article 14 of the EU AI Act, STROKE guarantees Human Oversight.
                        </p>
                        <p>
                            Every candidate analysis features an <strong>"Oversight Section"</strong> allowing recruiters to instantly override the AI’s generated score, and document their manual intervention securely. You are the sole decision-maker.
                        </p>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-white">
                        <BookOpen className="text-indigo-500" />
                        5. System Models & Limitations
                    </h2>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4 text-zinc-300 leading-relaxed">
                        <p>
                            STROKE uses Large Language Models provided by tier-1 providers such as Inception Labs and Mistral AI. All prompt versions and token usages are traced and securely logged for accountability.
                        </p>
                        <h4 className="text-white font-medium mt-6">Known Limitations</h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
                            <li>Strongly unstructured or visual resumes (e.g. nested tables) may result in incomplete text extraction.</li>
                            <li>Candidates with resumes containing less than 100 useful words will automatically receive a low score to enforce data reliability.</li>
                            <li>The system relies completely on the job description you provide; vague job descriptions will yield vague sorting.</li>
                        </ul>
                    </div>
                </section>

            </div>
        </InfoPageWrapper>
    );
};

export default Transparency;
