import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Log load progress for debugging
console.log('main.jsx loaded');

// Helper function to display visible error on the page
function displayVisibleError(message) {
  console.error(message);
  
  // Try to write to debug info if it exists
  const debugElement = document.getElementById('debug-info');
  if (debugElement) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `<p style="color: red"><strong>App Error:</strong> ${message}</p>`;
    debugElement.appendChild(errorDiv);
  }
  
  // Also create a visible error directly in the root element
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="color: white; background: #333; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 600px;">
        <h2 style="color: #f44336;">Error Loading Application</h2>
        <p>${message}</p>
        <p>Check the browser console for more details.</p>
      </div>
    `;
  }
}

// Use a try-catch block to render the app and catch any errors
try {
  console.log('Attempting to find root element');
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    console.log('Root element found, attempting to render app');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('App render initiated');
  } else {
    displayVisibleError('Root element not found in the DOM');
  }
} catch (error) {
  displayVisibleError(`Failed to render app: ${error.message}`);
}
