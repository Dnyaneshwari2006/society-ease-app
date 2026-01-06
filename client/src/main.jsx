import React from 'react';
import { createRoot } from 'react-dom/client';
// FIXED: Path changed from './App' to './services/App' to match your folder structure
import App from './services/App'; 

function Main() {
  return <App />;
}

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);