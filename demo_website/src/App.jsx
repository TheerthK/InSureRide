import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Registration from './pages/Registration.jsx';
import PolicyManagement from './pages/PolicyManagement.jsx';
import PremiumCalculator from './pages/PremiumCalculator.jsx';
import ClaimsManagement from './pages/ClaimsManagement.jsx';
import FraudIntelligence from './pages/FraudIntelligence.jsx';
import CommandCenter from './pages/CommandCenter.jsx';
import AdvancedThreatIntel from './pages/AdvancedThreatIntel.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/policies" element={<PolicyManagement />} />
          <Route path="/premium" element={<PremiumCalculator />} />
          <Route path="/claims" element={<ClaimsManagement />} />
          <Route path="/fraud" element={<FraudIntelligence />} />
          <Route path="/command" element={<CommandCenter />} />
          <Route path="/advanced" element={<AdvancedThreatIntel />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
