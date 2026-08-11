import ReactDOM from 'react-dom/client';
import { initializeUiLanguage } from '@/lib/ui-language';
import FullViewApp from '@/ui/fullview/App';
import '@/ui/global.css';

void initializeUiLanguage().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<FullViewApp />);
});
