import React from 'react';
import './Solution.css';
import { Activity, BookOpen, GitMerge, Hexagon, FileOutput } from 'lucide-react';

export default function Solution() {
  const solutions = [
    {
      icon: <Activity size={24} className="text-primary" />,
      title: "Characterization Analysis",
      desc: "Powerful tools for XRD, XPS, FTIR, Raman and more techniques."
    },
    {
      icon: <BookOpen size={24} className="text-accent" />,
      title: "Notebook Lab",
      desc: "Structured experiments, templates, and scientific context in one place."
    },
    {
      icon: <GitMerge size={24} className="text-cyan" />,
      title: "Project Workflow",
      desc: "Organize data, analyses, and results from raw to report seamlessly."
    },
    {
      icon: <Hexagon size={24} />,
      title: "Scientific Context",
      desc: "Metadata, conditions, references, and insights connected together."
    },
    {
      icon: <FileOutput size={24} />,
      title: "Exportable Insight",
      desc: "Create publication-ready reports and shareable results with ease."
    }
  ];

  return (
    <section className="solution bg-muted" id="solution">
      <div className="container">
        <div className="solution-layout">
          <div className="solution-left">
            <span className="label text-primary">OUR SOLUTION</span>
            <h2>DIFARYX combines everything into one scientific workflow.</h2>
          </div>
          <div className="solution-right">
            <div className="solution-grid">
              {solutions.map((item, idx) => (
                <div key={idx} className="solution-card">
                  <div className="solution-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
