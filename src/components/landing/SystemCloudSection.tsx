import React from 'react';

const tags = [
  'Modular',
  'Tool-integrated',
  'Extensible',
  'Reproducible',
  'Cloud-native',
  'API-first',
];

export default function SystemCloudSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="mb-4 text-center text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
          Designed for integration and scale
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-600">
          DIFARYX is modular and extensible. It connects analytical tools, data systems, and AI models to support reproducible scientific workflows at scale.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {tags.map((tag) => (
            <div
              key={tag}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[15px] font-bold text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
