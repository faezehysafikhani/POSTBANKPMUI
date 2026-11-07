import './tmpb/bootRuntimeConfig';
import '@fontsource-variable/vazirmatn/wght.css';
import '@fontsource/reem-kufi/600.css';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}
