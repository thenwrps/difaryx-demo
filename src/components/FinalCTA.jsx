import React from 'react';
import './FinalCTA.css';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="container">
        <div className="cta-box">
          <div className="cta-content">
            <h2>Built for researchers who want<br/>less tool switching and more <span className="text-primary">scientific clarity.</span></h2>
            <div className="cta-actions">
              <button className="btn btn-accent">
                JOIN CLOSED BETA
                <ArrowRight size={16} />
              </button>
              <a href="https://difaryx-web.vercel.app/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                VIEW DEMO
                <ArrowUpRight size={16} />
              </a>
            </div>
            <p className="cta-sub">Be part of the future of scientific workflow.</p>
          </div>
          {/* Subtle spectrum motif */}
          <div className="cta-motif">
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="motif-svg">
              <path d="M0,100 Q100,100 200,80 T400,100 T600,60 T800,100" fill="none" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.4"/>
              <path d="M0,120 Q150,120 250,90 T500,120 T700,80 T800,120" fill="none" stroke="var(--color-cyan)" strokeWidth="0.5" opacity="0.4"/>
              <path d="M0,140 Q200,140 300,110 T600,140 T750,100 T800,140" fill="none" stroke="var(--color-accent)" strokeWidth="0.5" opacity="0.4"/>
              {/* Grid lines */}
              <line x1="100" y1="0" x2="100" y2="200" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.5"/>
              <line x1="300" y1="0" x2="300" y2="200" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.5"/>
              <line x1="500" y1="0" x2="500" y2="200" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.5"/>
              <line x1="700" y1="0" x2="700" y2="200" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.5"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
