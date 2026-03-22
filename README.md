# RetailIQ Frontend

RetailIQ is the React + TypeScript frontend for the RetailIQ backend. This repository is now aligned to the current verified backend contracts and the workspace parity source of truth.

## Current Verified Status

- Frontend route-to-backend mapping is closed
- Frontend API stubs are removed
- Frontend `npm run type-check` passed
- Frontend `npm run lint` passed
- Frontend `npm run test` passed
- Frontend `npm run build` passed
- Frontend `npm audit --omit=dev` passed with zero vulnerabilities

## Source Of Truth

The canonical parity artifacts live in the workspace folder:

- `D:/Files/Desktop/Retailiq-Frnt-Bknd-Shortcuts/parity-source-of-truth.md`
- `D:/Files/Desktop/Retailiq-Frnt-Bknd-Shortcuts/parity-summary.json`
- `D:/Files/Desktop/Retailiq-Frnt-Bknd-Shortcuts/backend-to-frontend-matrix.csv`
- `D:/Files/Desktop/Retailiq-Frnt-Bknd-Shortcuts/frontend-to-backend-matrix.csv`

## Architecture

- React 18 + TypeScript
- Vite
- React Router v6
- TanStack Query
- Zustand
- Axios
- React Hook Form + Zod

## Notes

- Keep the frontend in sync with the backend contracts represented in the parity source of truth.
- Treat the backend URL in `.env` as the production integration target.
- Do not reintroduce stubbed API helpers or synthetic product data.
