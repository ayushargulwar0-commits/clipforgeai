import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root')!
const pathname = window.location.pathname.replace(/\/$/, '') || '/'
const isPrerenderedRoute = ['/', '/pricing', '/privacy', '/terms', '/contact', '/about'].includes(pathname)

if (rootElement.hasChildNodes() && isPrerenderedRoute) {
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
