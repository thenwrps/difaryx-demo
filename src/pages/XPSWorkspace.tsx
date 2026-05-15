import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { TechniqueWorkspaceShell } from '../components/workspace/TechniqueWorkspaceShell';

export default function XPSWorkspace() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'quick' ? 'quick' : 'project';
  const fileName = searchParams.get('file') ?? undefined;
  const sessionId = searchParams.get('sessionId') ?? undefined;

  return (
    <DashboardLayout>
      <TechniqueWorkspaceShell technique="xps" mode={mode} fileName={fileName} sessionId={sessionId} />
    </DashboardLayout>
  );
}
