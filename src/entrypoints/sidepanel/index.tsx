import ReactDOM from 'react-dom/client';
import { initializeUiLanguage } from '@/lib/ui-language';
import App from '@/ui/sidepanel/App';
import '@/ui/global.css';

void initializeUiLanguage().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
