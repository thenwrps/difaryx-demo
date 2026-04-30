export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  organization?: string;
}

export interface GoogleAuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
}

/**
 * DIFARYX → Google Drive export artifact
 */
export interface GoogleDriveExport {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
  provider: 'google-drive-demo';
}

/**
 * DIFARYX → Google Sheets logging artifact
 */
export interface GoogleSheetLog {
  id: string;
  rowCount: number;
  createdAt: string;
  provider: 'google-sheets-demo';
}