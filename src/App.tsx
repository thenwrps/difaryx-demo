import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import XrdWorkspace from './pages/XrdWorkspace';
import MultiTechWorkspace from './pages/MultiTechWorkspace';
import NotebookLab from './pages/NotebookLab';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspace/xrd" element={<XrdWorkspace />} />
        <Route path="/workspace/multi" element={<MultiTechWorkspace />} />
        <Route path="/notebook" element={<NotebookLab />} />
      </Routes>
    </Router>
  );
}

export default App;
