import React from 'react';
import './Capability.css';
import { ChevronRight, Activity, Database, Link, FileOutput } from 'lucide-react';

export default function Capability() {
  const steps = [
    {
      icon: <Activity size={32} className="text-primary"/>,
      title: "Analyze",
      desc: "Run advanced analysis on multiple techniques."
    },
    {
      icon: <Database size={32} className="text-primary"/>,
      title: "Structure",
      desc: "Convert raw data into structured datasets."
    },
    {
      icon: <Link size={32} className="text-primary"/>,
      title: "Connect",
      desc: "Link analysis with notebook context."
    },
    {
      icon: <FileOutput size={32} className="text-primary"/>,
      title: "Export",
      desc: "Generate publication-ready reports and figures."
    }
  ];

  return (
    <section className="capability container" id="capabilities">
      <span className="label text-primary">WHAT YOU CAN DO WITH DIFARYX</span>
      <div className="flow-container">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="flow-step">
              <div className="flow-icon-wrapper">
                {step.icon}
              </div>
              <div className="flow-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="flow-arrow">
                <ChevronRight size={24} className="text-primary"/>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
