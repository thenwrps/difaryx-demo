import React from 'react';
import { Quote } from 'lucide-react';

const researchFindings = [
  {
    quote: "I spend more time exporting, converting, and plotting data than actually analyzing it.",
    role: "Materials Scientist, University Lab",
    context: "XRD + XPS workflow"
  },
  {
    quote: "Every time I switch between Origin, CasaXPS, and Python, I lose context and have to re-orient myself.",
    role: "PhD Candidate, Catalysis Research",
    context: "Multi-technique characterization"
  },
  {
    quote: "I trust automation when I can see the parameters, inspect the preprocessing steps, and verify the evidence myself.",
    role: "Senior Researcher, National Lab",
    context: "Reproducibility requirements"
  },
  {
    quote: "Black-box automation tools are useless for scientific work. I need to understand how the system reached its conclusion.",
    role: "Principal Investigator, Materials Institute",
    context: "Decision transparency"
  }
];

export default function UserResearchSection() {
  return (
    <section id="research" className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Validated with researchers across materials science, catalysis, and surface chemistry
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            We interviewed 12 researchers at universities and national labs to understand their characterization workflows, pain points, and requirements for automation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {researchFindings.map((finding, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 border border-blue-200">
                <Quote size={18} className="text-blue-600" />
              </div>
              <p className="mb-4 text-[15px] leading-relaxed text-slate-700 italic">
                "{finding.quote}"
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <div className="text-[13px] font-bold text-slate-900">{finding.role}</div>
                  <div className="text-[12px] text-slate-500">{finding.context}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-8">
          <div className="text-center">
            <h3 className="mb-3 text-[20px] font-bold text-slate-900">Key Research Insight</h3>
            <p className="mx-auto max-w-3xl text-[15px] leading-relaxed text-slate-700">
              Researchers want automation that <span className="font-bold text-blue-700">preserves control</span>, <span className="font-bold text-blue-700">shows evidence</span>, and <span className="font-bold text-blue-700">explains reasoning</span>. They reject black-box systems that hide parameters or decision logic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
