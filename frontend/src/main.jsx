import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ShipyardClusterProvider } from './context/ShipyardClusterContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ShipyardClusterProvider>
      <App />
    </ShipyardClusterProvider>
  </React.StrictMode>,
)
