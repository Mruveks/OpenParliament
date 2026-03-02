import { Link, useLocation } from 'react-router-dom';
import {
  Users, Vote, BarChart3, Building2, Home, Globe,
  Menu, X, Sun, Moon, Languages,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useLanguage, LANGUAGE_LABELS, type Language } from '../hooks/useLanguage';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const NAV_ITEMS = [
    { path: '/', label: t('nav.dashboard'), icon: Home },
    { path: '/meps', label: t('nav.mepTracker'), icon: Users },
    { path: '/votes', label: t('nav.votingExplorer'), icon: Vote },
    { path: '/country', label: t('nav.countryMonitor'), icon: Globe },
    { path: '/committees', label: t('nav.committees'), icon: Building2 },
    { path: '/stats', label: t('nav.statistics'), icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-eu-blue text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-eu-yellow flex items-center justify-center">
                <span className="text-eu-blue font-bold text-lg">EP</span>
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">OpenParliment</h1>
                <p className="text-xs text-blue-200 leading-tight">European Parliament Explorer</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                return (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors">
                  <Languages size={16} />
                  <span className="hidden sm:inline">{language.toUpperCase()}</span>
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 w-40 z-50">
                      {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([code, label]) => (
                        <button key={code} onClick={() => { setLanguage(code); setLangOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === code ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button onClick={toggleTheme}
                className="p-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
                title={isDark ? 'Light mode' : 'Dark mode'}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden border-t border-white/10 px-4 py-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </main>

      <footer className="bg-slate-800 dark:bg-slate-900 text-slate-400 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm">
          <p>{t('footer.title')}</p>
          <p className="mt-1">
            {t('footer.dataFrom')}{' '}
            <a href="https://data.europarl.europa.eu" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {t('footer.portal')}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
