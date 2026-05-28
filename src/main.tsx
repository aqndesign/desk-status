// Fonts (Vite equivalent of next/font/google)
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'
import '@fontsource/sora/500.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/600.css'

// Stylesheet order per design system skill
import '@radix-ui/themes/styles.css'
import '@carbon/charts-react/styles.css'
import './globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
