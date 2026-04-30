# DIFARYX Google Integration Boundary

This folder contains an optional, clean boundary for Google integrations (Auth, Drive, Sheets).

## Current State (Demo Mode)
Currently, this is a **demo-safe implementation** that uses `localStorage` only. It does not make any real network calls or require real Google OAuth. 
It ensures that the demo remains deterministic and functions without any backend infrastructure or external dependencies.

- **Auth**: Simulates sign-in, returning a deterministic "Demo Researcher" profile.
- **Drive**: Simulates file upload, storing only metadata in local storage and generating mock URLs.
- **Sheets**: Simulates appending rows, storing the appended data array locally.

## Future Production Path
In a future production version, the stubs in this folder can be safely replaced with real implementations:
- `auth.ts` -> Google OAuth
- `drive.ts` -> Google Drive API
- `sheets.ts` -> Google Sheets API
- Add Google Cloud / Vertex AI if needed

## Core Constraint
The core DIFARYX agent runtime must remain independent from Google. Google integration should always be treated as an optional export/auth layer, preserving the deterministic and offline-capable nature of the scientific reasoning engine.
