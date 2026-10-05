import React, { useLayoutEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { AboutScreen } from './components/About/AboutScreen';
import { BoardScreen } from './components/Board/BoardScreen';
import { CompanyScreen } from './components/Company/CompanyScreen';
import { MarketScreen } from './components/Market/MarketScreen';
import { AppNav } from './components/common/AppNav';
import { Footer } from './components/common/Footer';
import { NotFound } from './components/common/NotFound';

/** Jump to the top, instantly and before paint, whenever the route path changes. */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

/**
 * The app shell: the masthead, the four routed screens with a catch-all not-found, and the footer.
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
