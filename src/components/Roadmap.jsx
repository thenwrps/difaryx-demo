import React from 'react';
import './Roadmap.css';
import { CheckCircle2 } from 'lucide-react';

export default function Roadmap() {
  const phases = [
    {
      id: "PHASE 1",
      timeline: "(Current)",
      title: "Core Platform",
      items: [
        "XRD, XPS, FTIR, Raman",
        "Notebook Lab",
        "Project Workflow",
        "Report Export"
      ],
      active: true
    },
    {
      id: "PHASE 2",
      timeline: "(Next)",
      title: "Expand & Integrate",
      items: [
        "More techniques (SEM/TEM, XRF)",
        "Advanced analysis modules",
        "Template & automation",
        "API & integrations"
      ],
      active: false
    },
    {
      id: "PHASE 3",
      timeline: "(Future)",
      title: "Collaborate & Scale",
      items: [
        "Multi-user collaboration",
        "Cloud sync & sharing",
        "Lab & instrument integration",
        "Organization & permissions"
      ],
      active: false
    },
    {
      id: "PHASE 4",
      timeline: "(Vision)",
      title: "Intelligent Science Platform",
      items: [
        "AI-assisted analysis",
        "Knowledge graph",
        "Predictive insights",
        "Autonomous workflows"
      ],
      active: false
    }
  ];

  return (
    <section className="roadmap container" id="roadmap">
      <span className="label text-primary">ROADMAP</span>
      
      <div className="roadmap-grid">
        {phases.map((phase, idx) => (
          <div key={idx} className="roadmap-col">
            <div className="phase-header">
              <div className={`phase-dot ${phase.active ? 'active' : ''}`}></div>
              <div className="phase-line"></div>
              <div className="phase-title">
                <strong>{phase.id}</strong> <span className="timeline">{phase.timeline}</span>
              </div>
            </div>
            <div className="phase-content">
              <h4>{phase.title}</h4>
              <ul className="phase-list">
                {phase.items.map((item, i) => (
                  <li key={i}>
                    <CheckCircle2 size={14} className={phase.active ? "text-primary" : "text-muted"}/>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
