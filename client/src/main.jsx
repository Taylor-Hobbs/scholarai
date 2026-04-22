import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LandingPage from './LandingPage.jsx'
import './index.css'

const isLanding = window.location.pathname === '/' || window.location.pathname === '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLanding ? <LandingPage /> : <App />}
  </React.StrictMode>,
)
