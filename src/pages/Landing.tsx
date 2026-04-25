import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Graph } from '../components/ui/Graph';
import { Activity, Beaker, Fingerprint, Waves } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <header className="flex items-center justify-between px-8 py-6 relative z-10">
        <div className="flex items-center">
          <Link to="/" className="bg-white px-4 py-2 rounded flex items-center">
            <img 
              src="/logo/difaryx.png" 
              alt="DIFARYX" 
              className="h-7 md:h-9 object-contain hover:opacity-90 cursor-pointer transition-none"
            />
          </Link>
        </div>
        <div className="flex gap-4">
          <Link to="/sign-in">
            <Button variant="outline">Sign in with Google</Button>
          </Link>
          <Link to="/demo">
            <Button variant="primary">Try Demo</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium text-cyan">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span>
            </span>
            Platform Demo v1.0
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            From Signal to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan">
              Scientific Insight
            </span>
          </h1>
          <p className="text-xl text-text-muted max-w-lg leading-relaxed">
            AI-native platform for spectroscopy and diffraction analysis. Accelerate materials characterization with guided interpretation and structured review.
          </p>
          <div className="flex gap-4 pt-4">
            <Link to="/sign-in">
              <Button size="lg" variant="primary">Access Workspace</Button>
            </Link>
            <Button size="lg" variant="secondary">View Documentation</Button>
          </div>
        </div>

        <div className="bg-surface/50 border border-border rounded-xl p-6 backdrop-blur-sm shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl pointer-events-none" />
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Activity size={16} className="text-primary" />
              <span>Real-time XRD Analysis</span>
            </div>
            <div className="text-xs font-mono text-cyan bg-cyan/10 px-2 py-1 rounded">CuFe2O4</div>
          </div>
          <Graph type="xrd" height={300} showBackground showResidual showCalculated />
        </div>
      </main>

      <footer className="border-t border-border bg-surface/30 relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-text-muted">Supported Techniques</div>
          <div className="flex flex-wrap gap-8 text-sm font-medium text-text-dim">
            <span className="flex items-center gap-2 text-text-main"><Activity size={16}/> XRD</span>
            <span className="flex items-center gap-2"><Waves size={16}/> XPS</span>
            <span className="flex items-center gap-2"><Beaker size={16}/> FTIR</span>
            <span className="flex items-center gap-2"><Fingerprint size={16}/> Raman</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
