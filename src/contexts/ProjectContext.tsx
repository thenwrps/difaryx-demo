import React, { createContext, useContext, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DemoProject, getProject, DEFAULT_PROJECT_ID } from '../data/demoProjects';

interface ProjectContextType {
  project: DemoProject;
  projectId: string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? DEFAULT_PROJECT_ID;
  const project = getProject(projectId);

  return (
    <ProjectContext.Provider value={{ project, projectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
