import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Home } from '../pages/Home';
import { Library } from '../pages/Library';
import { GamePage } from '../pages/GamePage';
import { Favorites } from '../pages/Favorites';
import { Leaderboards } from '../pages/Leaderboards';
import { Profile } from '../pages/Profile';
import { NavigationShell } from '../components/NavigationShell';
import { AuthProvider } from '../lib/auth';
import { Analytics } from '@vercel/analytics/react';

function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="route min-h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  // Group paths inside shell so animation key doesn't unmount shell
  const isGamePage = location.pathname.startsWith('/game/');
  const animKey = isGamePage ? location.pathname : location.pathname.split('/')[1] || '/';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={animKey}>
        {/* Pages inside Navigation Shell */}
        <Route element={<NavigationShell />}>
          <Route path="/" element={<Page><Home /></Page>} />
          <Route path="/games" element={<Page><Library /></Page>} />
          <Route path="/favorites" element={<Page><Favorites /></Page>} />
          <Route path="/leaderboards" element={<Page><Leaderboards /></Page>} />
          <Route path="/profile" element={<Page><Profile /></Page>} />
        </Route>
        
        {/* Pages outside Navigation Shell (Full Screen) */}
        <Route path="/game/:id" element={<Page><GamePage /></Page>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AnimatedRoutes />
        <Analytics />
      </HashRouter>
    </AuthProvider>
  );
}
