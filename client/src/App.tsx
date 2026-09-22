import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { AboutScreen } from './components/About/AboutScreen';
import { BoardScreen } from './components/Board/BoardScreen';
import { CompanyScreen } from './components/Company/CompanyScreen';
import { MarketScreen } from './components/Market/MarketScreen';
import { AppNav } from './components/common/AppNav';
import { Footer } from './components/common/Footer';
import { NotFound } from './components/common/NotFound';

/** Scroll the window to the top whenever the route path changes. */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/**
 * Root application shell: the masthead, the four routed screens with a catch-all not-found, and
 * the footer, each centring its own rail so the hero band can run edge to edge between them.
 * @returns The app shell
 */
export const App: React.FC = () => (
  <div
    className="flex min-h-dvh flex-col bg-paper"
    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    <ScrollToTop />
    <AppNav />
    <main className="flex flex-1 flex-col">
      <Routes>
        <Route path="/" element={<BoardScreen />} />
        <Route path="/company/:slug" element={<CompanyScreen />} />
        <Route path="/market" element={<MarketScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </div>
);
