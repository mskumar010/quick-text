import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css'
import App from './App.tsx';
import { IdProvider } from './idContext';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<IdProvider>
			<App />
		</IdProvider>
	</StrictMode>
);
