import React from 'react';

export default function EvidenceSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-4 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          Structured scientific decisions
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-600">
          DIFARYX generates decisions with clear evidence linkage and transparent reasoning.
        </p>
        
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-8 shadow-sm lg:p-12">
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="mb-3 text-[15px] font-bold text-slate-900">Decision Output:</p>
            <div className="space-y-2 text-[14px] leading-relaxed text-slate-700">
              <p>CuFe2O4 spinel phase identified with high confidence</p>
              <p>Signal features align with reference patterns</p>
              <p>Supporting evidence confirms structural consistency</p>
              <p>No dominant conflicting signals detected</p>
            </div>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
            <p className="mb-3 text-[15px] font-bold text-blue-900">Interpretation:</p>
            <div className="space-y-2 text-[14px] leading-relaxed text-blue-900">
              <p>The result is consistent with expected material behavior</p>
              <p>Further validation can be performed using complementary analysis</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
