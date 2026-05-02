import React from 'react';
import { Sparkles, Cloud, Database, Cpu, Network, BarChart3 } from 'lucide-react';

const googleServices = [
  {
    title: 'Gemini API',
    subtitle: 'AI-Powered Scientific Reasoning',
    points: [
      'Scientific interpretation and conflict resolution',
      'Multi-paragraph reasoning with evidence synthesis',
      'Literature cross-validation and hypothesis evaluation',
      'Natural language explanation of complex analytical results'
    ],
    Icon: Sparkles,
    color: 'purple'
  },
  {
    title: 'Google Cloud Platform',
    subtitle: 'Scalable Infrastructure',
    points: [
      'Cloud Storage for large-scale characterization datasets',
      'Compute Engine for distributed data processing',
      'Cloud Run for containerized agent deployment',
      'Vertex AI for model training and inference'
    ],
    Icon: Cloud,
    color: 'blue'
  }
];

const technicalIntegration = [
  {
    title: 'Gemini Integration',
    desc: 'Real-time scientific interpretation with source attribution and reasoning transparency',
    Icon: Sparkles
  },
  {
    title: 'Cloud Storage',
    desc: 'Scalable data management for XRD, XPS, FTIR, and Raman datasets with versioning',
    Icon: Database
  },
  {
    title: 'Compute Engine',
    desc: 'Distributed preprocessing and analysis for high-throughput characterization workflows',
    Icon: Cpu
  },
  {
    title: 'Cloud Run',
    desc: 'Containerized agent deployment with auto-scaling and load balancing',
    Icon: Network
  },
  {
    title: 'Vertex AI',
    desc: 'Custom model training for technique-specific pattern recognition and classification',
    Icon: BarChart3
  }
];

const colorMap = {
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700'
  }
};

export default function GoogleAlignmentSection() {
  return (
    <section id="google" className="border-t border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[32px] font-bold leading-[1.2] text-slate-900 lg:text-[40px]">
            Powered by Google Cloud and Gemini
          </h2>
          <p className="mx-auto max-w-3xl text-[16px] leading-relaxed text-slate-600">
            DIFARYX leverages Google Cloud Platform services and Gemini API to deliver scalable, intelligent scientific workflow automation with enterprise-grade reliability.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {googleServices.map(({ title, subtitle, points, Icon, color }) => {
            const colors = colorMap[color as keyof typeof colorMap];
            return (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="mb-6 flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} border ${colors.border}`}>
                    <Icon size={20} className={colors.icon} />
                  </div>
                  <div>
                    <h3 className="mb-1 text-[18px] font-bold text-slate-900">{title}</h3>
                    <p className="text-[13px] font-semibold text-slate-600">{subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${colors.badge}`} />
                      <span className="text-[14px] leading-relaxed text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h3 className="mb-6 text-center text-[20px] font-bold text-slate-900">Google Cloud Integration</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {technicalIntegration.map(({ title, desc, Icon }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                  <Icon size={20} className="text-slate-600" />
                </div>
                <h4 className="mb-2 text-[13px] font-bold text-slate-900">{title}</h4>
                <p className="text-[11px] leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <div className="text-center">
            <p className="text-[14px] leading-relaxed text-slate-700">
              <span className="font-bold text-blue-700">Cloud-native architecture</span> enables DIFARYX to scale from single-user research workflows to enterprise-wide characterization platforms with centralized data management, distributed processing, and collaborative analysis.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
