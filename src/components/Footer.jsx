import React from 'react';
import './Footer.css';
import { ArrowRight, Mail, Globe, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer bg-dark">
      <div className="container">
        <div className="footer-grid">
          
          <div className="footer-brand">
            <div className="footer-logo">
              <a href="#">
                <img src="/logo/difaryx.png" alt="DIFARYX" className="logo-img" />
              </a>
            </div>
            <p className="footer-tagline">From scientific signal to structured insight.</p>
            <div className="footer-socials">
              <a href="#"><Globe size={18}/></a>
              <a href="#"><Mail size={18}/></a>
              <a href="#"><MessageSquare size={18}/></a>
            </div>
            <p className="footer-copyright">© 2024 DIFARYX. All rights reserved.</p>
          </div>

          <div className="footer-links">
            <div className="link-col">
              <h4>PRODUCT</h4>
              <a href="#overview">Overview</a>
              <a href="#techniques">Techniques</a>
              <a href="#notebook-lab">Notebook Lab</a>
              <a href="#use-cases">Use Cases</a>
            </div>
            <div className="link-col">
              <h4>COMPANY</h4>
              <a href="#about">About</a>
              <a href="#investor-briefing">Investor Briefing</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="link-col">
              <h4>RESOURCES</h4>
              <a href="#docs">Documentation</a>
              <a href="#help">Help Center</a>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>

          <div className="footer-subscribe">
            <h4>STAY UPDATED</h4>
            <p>Join our waitlist for updates and early access.</p>
            <form className="subscribe-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" className="btn-accent">
                <ArrowRight size={16}/>
              </button>
            </form>
          </div>

        </div>
      </div>
    </footer>
  );
}
