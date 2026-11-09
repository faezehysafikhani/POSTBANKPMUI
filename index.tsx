import './tmpb/bootRuntimeConfig';
import '@fontsource-variable/vazirmatn/wght.css';
import '@fontsource/reem-kufi/600.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import 'material-symbols/outlined.css';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { startActivityTracking } from './tmpb/utils/sessionActivity';
import { applyStoredWorkspaceTheme } from './components/WorkspaceTheme';

// Set the saved theme before the first paint so the page never flashes the default colours.
applyStoredWorkspaceTheme();
startActivityTracking();
import './styles/sky-theme.css';
import './styles/compact-ui.css';
import './styles/postbank-glass.css';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}

import './styles/postbank-login.css';
import './styles/postbank-workspace.css';
import './styles/pb-theme-palette.css';
import './styles/pb-themes.css';
import './styles/pb-themes-more.css';
import './styles/logo-only.css';
import './styles/typography.css';
import './styles/single-line.css';
