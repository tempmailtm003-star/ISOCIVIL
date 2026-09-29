import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ResponderApp } from './ResponderApp.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import './index.css';

const MainComponent = () => {
  // Always start from ERC Tactical Command by default
  const [isResponder, setIsResponder] = useState(false);

  useEffect(() => {
    // If there's an initial hash on startup, clear it so application starts from ERC Tactical Command
    if (window.location.hash === '#responder') {
      window.history.replaceState(null, '', window.location.pathname);
    }

    const handleHashChange = () => {
      setIsResponder(window.location.hash === '#responder');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return isResponder ? (
    <ResponderApp 
      onReturnToDispatcher={() => {
        window.location.hash = '';
        setIsResponder(false);
      }} 
    />
  ) : (
    <App />
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MainComponent />
    </ThemeProvider>
  </StrictMode>,
);
