import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Analysis } from './pages/Analysis';
import { Cases } from './pages/Cases';
import { CaseDetails } from './pages/CaseDetails';
import { Evidence } from './pages/Evidence';
import { Reports } from './pages/Reports';
import { Report } from './pages/Report';
import { Bob } from './pages/Bob';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            <Routes>
              {/* Primary Dashboard */}
              <Route path="/" element={<Dashboard />} />

              {/* Ingestion & Analysis */}
              <Route path="/upload" element={<Upload />} />
              <Route path="/analysis/new" element={<Upload />} />
              <Route path="/analysis/:caseId" element={<Analysis />} />

              {/* Case Repository & Workstation */}
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/:caseId" element={<CaseDetails />} />

              {/* Cross-Case Evidence Library */}
              <Route path="/evidence" element={<Evidence />} />

              {/* Reports & Courtroom Dossiers */}
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:caseId" element={<Report />} />
              <Route path="/report/:caseId" element={<Report />} />

              {/* IBM Bob Specialist */}
              <Route path="/bob" element={<Bob />} />
              <Route path="/ibm-bob" element={<Bob />} />

              {/* Settings & Hardware / AI Model Registry */}
              <Route path="/settings" element={<Settings />} />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
