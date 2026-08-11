import ReactDOM from 'react-dom/client';
import { initializeUiLanguage } from '@/lib/ui-language';
import App from '@/ui/options/App';
import '@/ui/options/index.css';

void initializeUiLanguage().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
