import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
console.log('Environment variables:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'Set' : 'Missing',
  groqApiKey: import.meta.env.VITE_GROQ_API_KEY ? 'Set' : 'Missing'
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});