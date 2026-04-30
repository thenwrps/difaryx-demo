import { GoogleUploadResult } from './types';

const DRIVE_STORAGE_KEY = 'difaryx_google_drive_exports';

export async function uploadReportToGoogleDriveDemo(fileName: string, content: string | Blob): Promise<GoogleUploadResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const newExport: GoogleUploadResult = {
    id: `gdrive_demo_${Math.random().toString(36).substring(2, 9)}`,
    fileName,
    url: `https://drive.google.com/demo/file/d/${Math.random().toString(36).substring(2, 15)}/view`,
    createdAt: new Date().toISOString(),
    provider: 'google-drive-demo'
  };

  const stored = localStorage.getItem(DRIVE_STORAGE_KEY);
  const exportsList: GoogleUploadResult[] = stored ? JSON.parse(stored) : [];
  
  // We're not actually storing the content in localStorage to avoid quota issues,
  // just the metadata of the upload record.
  exportsList.push(newExport);
  localStorage.setItem(DRIVE_STORAGE_KEY, JSON.stringify(exportsList));

  return newExport;
}
