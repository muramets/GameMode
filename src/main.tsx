import './utils/logger'
declare const __APP_VERSION__: string;
console.log(
  `%c MonkeyLearn %c v${__APP_VERSION__} `,
  'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
  'background: #41b883; padding: 1px; border-radius: 0 3px 3px 0; color: #fff'
);
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
