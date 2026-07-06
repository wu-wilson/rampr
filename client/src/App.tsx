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
 * Root application shell. The warm-paper surface (with its faint grain) fills the whole
 * viewport; content and the sectioning hairlines stay in a centered 1280px rail. Routes the
 * four screens with a catch-all not-found, framed by the persistent nav and footer.
 * @returns The app shell
 */
export const App: React.FC = () => (
  <div className="app-surface min-h-dvh">
    <ScrollToTop />
    <div
      className="mx-auto min-h-dvh w-full max-w-rail"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <AppNav />
      <main>
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
  </div>
);
