import React from 'react';
import './Hero.css';
import { ArrowRight, ArrowUpRight, Search, Bell, Settings, Home, FileText, Database, Activity, BookOpen, Library } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero container">
      <div className="hero-left">
        <span className="label text-primary">SCIENTIFIC WORKFLOW PLATFORM</span>
        <h1>From scientific signal to <span className="text-primary">structured insight.</span></h1>
        <p className="hero-body">
          DIFARYX is a next-generation platform for materials characterization, analysis, and lab knowledge organization.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary">
            JOIN CLOSED BETA
            <ArrowRight size={16} />
          </button>
          <a href="https://difaryx-web.vercel.app/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            VIEW DEMO
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="trust-label">Built for academic and R&D workflows</div>
      </div>
      
      <div className="hero-right">
        <div className="ui-card">
          {/* UI Sidebar Mock */}
          <div className="ui-sidebar">
            <div className="ui-logo">
              <img src="/logo/difaryx.png" alt="DIFARYX" className="logo-img logo-img-compact" />
            </div>
            <div className="ui-nav">
              <div className="ui-nav-item active"><Home size={14}/> Overview</div>
              <div className="ui-nav-item"><Database size={14}/> Data</div>
              <div className="ui-nav-item"><Activity size={14}/> Analyses</div>
              <div className="ui-nav-item"><BookOpen size={14}/> Notebook Lab</div>
              <div className="ui-nav-item"><FileText size={14}/> Reports</div>
              <div className="ui-nav-item"><Library size={14}/> Library</div>
              <div className="ui-nav-item mt-auto"><Settings size={14}/> Settings</div>
            </div>
          </div>
          
          {/* UI Main Area */}
          <div className="ui-main">
            <div className="ui-header">
              <div className="ui-breadcrumb">Project / <strong>LiFePO4 Characterization</strong> <span className="chevron">v</span></div>
              <div className="ui-header-actions">
                <Search size={14} className="icon-subtle"/>
                <Bell size={14} className="icon-subtle"/>
                <div className="avatar">R</div>
              </div>
            </div>
            
            <div className="ui-content">
              <h3>Overview</h3>
              
              <div className="ui-stats">
                <div className="stat-box">
                  <span className="stat-label">Projects</span>
                  <span className="stat-value">24</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Datasets</span>
                  <span className="stat-value">156</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Analyses</span>
                  <span className="stat-value">342</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Reports</span>
                  <span className="stat-value">27</span>
                </div>
              </div>
              
              <div className="ui-chart-box">
                <div className="chart-header">
                  <span className="chart-title">Signal Overview</span>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="dot dot-xrd"></span>XRD</span>
                    <span className="legend-item"><span className="dot dot-xps"></span>XPS</span>
                    <span className="legend-item"><span className="dot dot-ftir"></span>FTIR</span>
                    <span className="legend-item"><span className="dot dot-raman"></span>Raman</span>
                  </div>
                </div>
                <div className="chart-area">
                  <svg viewBox="0 0 500 120" className="chart-svg">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="var(--color-border)" strokeWidth="0.5"/>
                    <line x1="0" y1="50" x2="500" y2="50" stroke="var(--color-border)" strokeWidth="0.5"/>
                    <line x1="0" y1="80" x2="500" y2="80" stroke="var(--color-border)" strokeWidth="0.5"/>
                    <line x1="0" y1="110" x2="500" y2="110" stroke="var(--color-border)" strokeWidth="0.5"/>
                    
                    {/* Raman (Red) */}
                    <path d="M0,105 L20,105 L30,100 L40,105 L70,105 L80,70 L90,105 L150,105 L160,85 L170,105 L250,105 L260,40 L270,105 L350,105 L360,20 L370,105 L500,105" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round"/>
                    {/* FTIR (Green) */}
                    <path d="M0,85 L25,85 L35,80 L45,85 L75,85 L85,50 L95,85 L135,85 L145,65 L155,85 L255,85 L265,30 L275,85 L355,85 L365,10 L375,85 L500,85" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round"/>
                    {/* XPS (Purple) */}
                    <path d="M0,65 L30,65 L40,60 L50,65 L80,65 L90,30 L100,65 L120,65 L130,45 L140,65 L260,65 L270,10 L280,65 L360,65 L370,5 L380,65 L500,65" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinejoin="round"/>
                    {/* XRD (Blue) */}
                    <path d="M0,45 L35,45 L45,40 L55,45 L85,45 L95,10 L105,45 L115,45 L125,25 L135,45 L265,45 L275,5 L285,45 L365,45 L375,0 L385,45 L500,45" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <div className="chart-x-axis">
                    <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span>
                  </div>
                  <div className="chart-x-label">2θ (°)</div>
                </div>
              </div>
              
              <div className="ui-bottom-row">
                <div className="recent-analyses">
                  <div className="box-header">
                    <span>Recent Analyses</span>
                    <span className="icon-subtle">×</span>
                  </div>
                  <div className="analysis-item">
                    <span className="badge badge-blue">XRD</span>
                    <div className="analysis-info">
                      <span className="analysis-title">LiFePO4_sample</span>
                      <span className="analysis-meta">2θ: 10° - 80° • 1h ago</span>
                    </div>
                  </div>
                  <div className="analysis-item">
                    <span className="badge badge-purple">XPS</span>
                    <div className="analysis-info">
                      <span className="analysis-title">Graphene oxide</span>
                      <span className="analysis-meta">Survey • 3h ago</span>
                    </div>
                  </div>
                  <div className="analysis-item">
                    <span className="badge badge-red">FTIR</span>
                    <div className="analysis-info">
                      <span className="analysis-title">Polymer film</span>
                      <span className="analysis-meta">400 - 4000 cm⁻¹ • 1h ago</span>
                    </div>
                  </div>
                </div>
                
                <div className="notebook-lab-card">
                  <div className="box-header">
                    <span>Notebook Lab</span>
                  </div>
                  <p className="notebook-sub">Continue your experiment</p>
                  <div className="workflow-box">
                    <div className="workflow-info">
                      <span className="workflow-title">Surface analysis workflow</span>
                      <span className="workflow-meta">Updated 1 h ago</span>
                    </div>
                    <ArrowRight size={14} className="icon-subtle"/>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
