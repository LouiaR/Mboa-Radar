/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import AlertPage from './pages/AlertPage';
import PlanRoutePage from './pages/PlanRoutePage';
import AuthPage from './pages/AuthPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import { LanguageProvider } from './contexts/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Layout><MapPage /></Layout>} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/alerts" element={<AlertPage />} />
          <Route path="/plan" element={<PlanRoutePage />} />
          <Route path="/stats" element={<Layout><StatsPage /></Layout>} />
          <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}



