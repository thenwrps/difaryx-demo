import React from 'react';
import './Techniques.css';
import { ChevronRight } from 'lucide-react';

export default function Techniques() {
  return (
    <section className="techniques container" id="techniques">
      <span className="label text-primary">TECHNIQUES WE SUPPORT</span>
      
      <div className="techniques-layout">
        <div className="techniques-grid">
          
          {/* XRD Card */}
          <div className="tech-card">
            <div className="tech-header">
              <h3>XRD</h3>
            </div>
            <div className="tech-visual">
              <svg viewBox="0 0 400 100" className="spectrum-svg" preserveAspectRatio="none">
                <line x1="0" y1="90" x2="400" y2="90" stroke="var(--color-border)" strokeWidth="1"/>
                <path d="M0,90 L20,90 L25,85 L30,20 L35,90 L80,90 L85,60 L90,90 L120,90 L125,30 L130,90 L200,90 L205,70 L210,90 L280,90 L285,40 L290,90 L360,90 L365,75 L370,90 L400,90" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <div className="axis-labels">
                <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span>
              </div>
              <div className="axis-title">2θ (°)</div>
            </div>
            <p className="tech-desc">Phase identification and crystal structure analysis.</p>
          </div>

          {/* XPS Card */}
          <div className="tech-card">
            <div className="tech-header">
              <h3>XPS</h3>
            </div>
            <div className="tech-visual">
              <svg viewBox="0 0 400 100" className="spectrum-svg" preserveAspectRatio="none">
                <line x1="0" y1="90" x2="400" y2="90" stroke="var(--color-border)" strokeWidth="1"/>
                <path d="M0,90 L50,90 L55,10 L60,90 L180,90 L185,40 L190,90 L280,90 L285,60 L290,90 L400,90" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/>
                <text x="55" y="15" fontSize="10" fill="var(--color-text-muted)" textAnchor="end">O 1s</text>
                <text x="185" y="35" fontSize="10" fill="var(--color-text-muted)" textAnchor="end">Ti 2p</text>
                <text x="285" y="55" fontSize="10" fill="var(--color-text-muted)" textAnchor="end">C 1s</text>
              </svg>
              <div className="axis-labels">
                <span>1200</span><span>1000</span><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span>
              </div>
              <div className="axis-title">Binding Energy (eV)</div>
            </div>
            <p className="tech-desc">Surface composition and chemical state analysis.</p>
          </div>

          {/* FTIR Card */}
          <div className="tech-card">
            <div className="tech-header">
              <h3>FTIR</h3>
            </div>
            <div className="tech-visual">
              <svg viewBox="0 0 400 100" className="spectrum-svg" preserveAspectRatio="none">
                <line x1="0" y1="10" x2="400" y2="10" stroke="var(--color-border)" strokeWidth="1"/>
                {/* Downward absorption bands */}
                <path d="M0,10 L30,10 L40,30 L50,10 L90,10 L100,50 L110,10 L190,10 L200,80 L210,50 L220,70 L230,10 L310,10 L320,40 L330,10 L400,10" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <div className="axis-labels">
                <span>4000</span><span>3000</span><span>2000</span><span>1500</span><span>1000</span><span>500</span>
              </div>
              <div className="axis-title">Wavenumber (cm⁻¹)</div>
            </div>
            <p className="tech-desc">Functional group identification and molecular analysis.</p>
          </div>

          {/* Raman Card */}
          <div className="tech-card">
            <div className="tech-header">
              <h3>Raman</h3>
            </div>
            <div className="tech-visual">
              <svg viewBox="0 0 400 100" className="spectrum-svg" preserveAspectRatio="none">
                <line x1="0" y1="90" x2="400" y2="90" stroke="var(--color-border)" strokeWidth="1"/>
                <path d="M0,90 L40,90 L45,70 L50,90 L120,90 L125,20 L130,90 L240,90 L245,10 L250,90 L280,90 L285,50 L290,90 L360,90 L365,60 L370,90 L400,90" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <div className="axis-labels">
                <span>500</span><span>1000</span><span>1500</span><span>2000</span><span>2500</span><span>3000</span>
              </div>
              <div className="axis-title">Raman shift (cm⁻¹)</div>
            </div>
            <p className="tech-desc">Molecular vibrations and structural information.</p>
          </div>

        </div>

        {/* Coming Soon Column */}
        <div className="coming-soon-col">
          <span className="label text-cyan">COMING SOON</span>
          <div className="cs-list">
            <div className="cs-item"><span>SEM / TEM</span> <ChevronRight size={16} className="icon-subtle"/></div>
            <div className="cs-item"><span>XRF / XAS</span> <ChevronRight size={16} className="icon-subtle"/></div>
            <div className="cs-item"><span>MS / GC</span> <ChevronRight size={16} className="icon-subtle"/></div>
            <div className="cs-item"><span>ICP-OES</span> <ChevronRight size={16} className="icon-subtle"/></div>
            <div className="cs-item-more">and more...</div>
          </div>
        </div>
      </div>
    </section>
  );
}
