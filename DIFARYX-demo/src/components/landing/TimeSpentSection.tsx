import React from 'react';

export default function TimeSpentSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Reducing manual analysis time through execution
          </h2>
          <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-slate-600">
            Manual workflows require iterative processing and interpretation.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">
            DIFARYX reduces execution time by automating structured workflows.
          </p>
        </div>
      </div>
    </section>
  );
}
