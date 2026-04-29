import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import MultiTechWorkspace from "./pages/MultiTechWorkspace";
import TechniqueWorkspace from "./pages/TechniqueWorkspace";
import NotebookLab from "./pages/NotebookLab";
import AgentDemo from "./pages/AgentDemo";
import HistoryPage from "./pages/History";
import SettingsPage from "./pages/Settings";
import SignIn from "./pages/SignIn";
import { isDemoMode } from "./config/demoMode";

function App() {
  void isDemoMode;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspace/multi" element={<MultiTechWorkspace />} />
        <Route path="/workspace/:technique" element={<TechniqueWorkspace />} />
        <Route path="/notebook" element={<NotebookLab />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/demo/agent" element={<AgentDemo />} />
      </Routes>
    </Router>
  );
}

export default App;
