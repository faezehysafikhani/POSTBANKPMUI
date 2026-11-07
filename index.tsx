import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
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
