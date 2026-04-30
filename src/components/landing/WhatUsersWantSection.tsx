import React from 'react';

const priorities = [
  'Cross-technique comparison in one system',
  'Support for all instrument file formats',
  'Automated preprocessing with full parameter control',
];

export default function WhatUsersWantSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-12 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          What researchers actually want
        </h2>
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-[16px] leading-relaxed text-slate-600">
            Across multiple sources, researchers consistently prioritize:
          </p>
          <div className="mb-8 space-y-4">
            {priorities.map((item, index) => (
              <div key={item} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[15px] font-bold text-white">
                  {index + 1}
                </div>
                <p className="pt-1 text-[16px] leading-relaxed text-slate-900">{item}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="mb-3 text-[15px] font-bold text-amber-900">Notably:</p>
            <p className="mb-3 text-[15px] leading-relaxed text-amber-900">
              Automation is preferred only when parameters remain controllable. Black-box automation is consistently rejected.
            </p>
            <p className="text-[15px] leading-relaxed text-amber-900">
              AI-driven interpretation ranks as a supporting feature, not the primary need.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
