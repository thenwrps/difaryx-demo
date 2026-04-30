import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import WorkflowRealitySection from '../components/landing/WorkflowRealitySection';
import TimeSpentSection from '../components/landing/TimeSpentSection';
import WhatUsersWantSection from '../components/landing/WhatUsersWantSection';
import EvidenceSection from '../components/landing/EvidenceSection';
import SolutionSection from '../components/landing/SolutionSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import AgentDemoSection from '../components/landing/AgentDemoSection';
import ResearcherControlSection from '../components/landing/ResearcherControlSection';
import MultiTechniqueSection from '../components/landing/MultiTechniqueSection';
import SystemCloudSection from '../components/landing/SystemCloudSection';
import CTASection from '../components/landing/CTASection';
import FooterSection from '../components/landing/FooterSection';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <WorkflowRealitySection />
      <TimeSpentSection />
      <WhatUsersWantSection />
      <EvidenceSection />
      <SolutionSection />
      <WorkflowSection />
      <AgentDemoSection />
      <ResearcherControlSection />
      <MultiTechniqueSection />
      <SystemCloudSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
