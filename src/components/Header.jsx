import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="header container">
      <div className="header-left">
        <div className="logo">
          <a href="#">
            <img src="/logo/difaryx.png" alt="DIFARYX" className="logo-img" />
          </a>
        </div>
        <nav className="nav">
          <a href="#product">Product</a>
          <a href="#techniques">Techniques</a>
          <a href="#notebook-lab">Notebook Lab</a>
          <a href="#roadmap">Roadmap</a>
          <a href="https://difaryx-web.vercel.app/" target="_blank" rel="noopener noreferrer">Demo</a>
          <a href="#company">Company</a>
          <a href="#investor-briefing">Investor Briefing</a>
        </nav>
      </div>
      <div className="header-right">
        <button className="btn btn-primary">
          Join Closed Beta
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </header>
  );
}
