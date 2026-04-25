import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import TechniquesSection from '../components/landing/TechniquesSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import RoadmapSection from '../components/landing/RoadmapSection';
import CTASection from '../components/landing/CTASection';
import FooterSection from '../components/landing/FooterSection';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <TechniquesSection />
      <WorkflowSection />
      <RoadmapSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
