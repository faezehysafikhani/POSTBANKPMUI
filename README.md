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

The landing dashboard shows portfolio statistics, a Persian month calendar and the project-status chart.
Personal events are loaded and created through `/api/events`; entered times use Asia/Tehran.
The event form's people, minutes and task-link tabs are preview sections; the current Events API stores
the title, description/agenda, UTC start/end times and reminder interval. Creating an event requires a signed-in account.

## Checks

```powershell
npm run lint
npm run build
```
