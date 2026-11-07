# PostBank Project Management UI

React and TypeScript project-management interface.

## Run

```powershell
cd F:\POSTBANKPM\POSTBANKPMUI
npm install
npm run dev
```

Open http://localhost:3000. Run only one development server per port.

This branch retains the existing NexusCore/.NET backend integration and server-side API proxy.
Start the API separately (default `http://localhost:5251`), or set `BACKEND_URL` when running the UI server.
Use an account registered in the backend; local demo users are not used on this branch.

The Post Bank interface includes compact glass dashboard cards, a unified portfolio,
creation dialogs, a settings navigation preview, reports navigation and a document-upload dialog.
The document dialog passes the selected `File` to the existing backend upload handler.

## Checks

```powershell
npm run lint
npm run build
```
