import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection_NEW';
import ProblemSection from '../components/landing/ProblemSection_NEW';
import UserResearchSection from '../components/landing/UserResearchSection_NEW';
import SolutionSection from '../components/landing/SolutionSection_NEW';
import ProductFunctionSection from '../components/landing/ProductFunctionSection_NEW';
import AgentDemoSection from '../components/landing/AgentDemoSection_NEW';
import GoogleAlignmentSection from '../components/landing/GoogleAlignmentSection_NEW';
import TechniqueCoverageSection from '../components/landing/TechniqueCoverageSection_NEW';
import TrustControlSection from '../components/landing/TrustControlSection_NEW';
import CTASection from '../components/landing/CTASection_NEW';
import FooterSection from '../components/landing/FooterSection';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <UserResearchSection />
      <SolutionSection />
      <ProductFunctionSection />
      <AgentDemoSection />
      <GoogleAlignmentSection />
      <TechniqueCoverageSection />
      <TrustControlSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
