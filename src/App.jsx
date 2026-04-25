import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Solution from './components/Solution';
import Techniques from './components/Techniques';
import Capability from './components/Capability';
import Roadmap from './components/Roadmap';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Techniques />
        <Capability />
        <Roadmap />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
