import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './reference.css'
import './animations.css'
import './resign.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
