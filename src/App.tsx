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
import XPSWorkspace from "./pages/XPSWorkspace";
import FTIRWorkspace from "./pages/FTIRWorkspace";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/workspace/multi"
            element={
              <ProtectedRoute>
                <MultiTechWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/xps"
            element={
              <ProtectedRoute>
                <XPSWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/ftir"
            element={
              <ProtectedRoute>
                <FTIRWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:technique"
            element={
              <ProtectedRoute>
                <TechniqueWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notebook"
            element={
              <ProtectedRoute>
                <NotebookLab />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/demo/agent"
            element={
              <ProtectedRoute>
                <AgentDemo />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
