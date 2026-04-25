import React from 'react';
import './Problem.css';
import { FileText, Database, Repeat, Link2Off, HelpCircle } from 'lucide-react';

export default function Problem() {
  const problems = [
    {
      icon: <FileText size={24} />,
      title: "Raw files",
      desc: "Data scattered across instruments and formats."
    },
    {
      icon: <Database size={24} />,
      title: "Scattered notes",
      desc: "Important insights lost in disconnected places."
    },
    {
      icon: <Repeat size={24} />,
      title: "Repeated steps",
      desc: "Manual work and inconsistent analysis every time."
    },
    {
      icon: <Link2Off size={24} />,
      title: "Disconnected tools",
      desc: "Too many software, no unified workflow."
    },
    {
      icon: <HelpCircle size={24} />,
      title: "Hard to reproduce",
      desc: "Results and context are difficult to trace."
    }
  ];

  return (
    <section className="problem container" id="problem">
      <div className="problem-header">
        <span className="label text-primary">THE PROBLEM</span>
        <h2>Scientific data is everywhere.<br/>The workflow is still fragmented.</h2>
      </div>
      <div className="problem-grid">
        {problems.map((item, idx) => (
          <div key={idx} className="problem-card">
            <div className="problem-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
