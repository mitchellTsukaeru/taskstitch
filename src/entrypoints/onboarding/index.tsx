import ReactDOM from 'react-dom/client';
import { initializeUiLanguage } from '@/lib/ui-language';
import OnboardingApp from '@/ui/onboarding/App';
import '@/ui/global.css';

void initializeUiLanguage().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<OnboardingApp />);
});
