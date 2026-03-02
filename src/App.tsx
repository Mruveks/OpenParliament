import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { LanguageProvider } from './hooks/useLanguage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MEPTracker from './pages/MEPTracker';
import MEPProfile from './pages/MEPProfile';
import VotingExplorer from './pages/VotingExplorer';
import CountryMonitor from './pages/CountryMonitor';
import CommitteeExplorer from './pages/CommitteeExplorer';
import Statistics from './pages/Statistics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/meps" element={<MEPTracker />} />
                <Route path="/meps/:id" element={<MEPProfile />} />
                <Route path="/votes" element={<VotingExplorer />} />
                <Route path="/country" element={<CountryMonitor />} />
                <Route path="/country/:countryCode" element={<CountryMonitor />} />
                <Route path="/committees" element={<CommitteeExplorer />} />
                <Route path="/stats" element={<Statistics />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
