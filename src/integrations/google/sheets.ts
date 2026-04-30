import { GoogleSheetAppendResult } from './types';

const SHEETS_STORAGE_KEY = 'difaryx_google_sheet_rows';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function appendAgentRunToGoogleSheetDemo(row: any[]): Promise<GoogleSheetAppendResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const stored = localStorage.getItem(SHEETS_STORAGE_KEY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[][] = stored ? JSON.parse(stored) : [];
  
  rows.push(row);
  localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(rows));

  return {
    id: `gsheet_demo_row_${rows.length}`,
    rowCount: rows.length,
    createdAt: new Date().toISOString(),
    provider: 'google-sheets-demo'
  };
}
