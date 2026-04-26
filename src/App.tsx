import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import MultiTechWorkspace from "./pages/MultiTechWorkspace";
import NotebookLab from "./pages/NotebookLab";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspace/multi" element={<MultiTechWorkspace />} />
        <Route path="/notebook" element={<NotebookLab />} />
      </Routes>
    </Router>
  );
}

export default App;