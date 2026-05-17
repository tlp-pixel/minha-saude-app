import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ViewHome from './views/ViewHome';
import ViewExams from './views/ViewExams';
import ViewExamDetail from './views/ViewExamDetail';
import ViewBiomarkers from './views/ViewBiomarkers';
import ViewBioDetail from './views/ViewBioDetail';
import ViewCompare from './views/ViewCompare';
import ViewInsights from './views/ViewInsights';
import ViewUpload from './views/ViewUpload';
import ViewDossie from './views/ViewDossie';
import ViewMedicos from './views/ViewMedicos';
import ViewSettings from './views/ViewSettings';
import { loadExamsIndex, loadBiomarkers, isConfigured } from './lib/storage';

export default function App() {
  const [examCount, setExamCount] = useState(null);
  const [bioCount, setBioCount] = useState(null);

  useEffect(() => {
    if (!isConfigured()) return;
    loadExamsIndex().then(e => setExamCount((e || []).length)).catch(() => {});
    loadBiomarkers().then(b => setBioCount(Object.keys(b || {}).length)).catch(() => {});
  }, []);

  return (
    <div className="app">
      <Sidebar
        examCount={examCount}
        bioCount={bioCount}
        userName="Thalita"
      />
      <main className="main">
        <Routes>
          <Route path="/"                    element={<ViewHome />} />
          <Route path="/exames"              element={<ViewExams />} />
          <Route path="/exames/:id"          element={<ViewExamDetail />} />
          <Route path="/biomarcadores"       element={<ViewBiomarkers />} />
          <Route path="/biomarcadores/:id"   element={<ViewBioDetail />} />
          <Route path="/comparar"            element={<ViewCompare />} />
          <Route path="/insights"            element={<ViewInsights />} />
          <Route path="/upload"              element={<ViewUpload />} />
          <Route path="/medicos"             element={<ViewMedicos />} />
          <Route path="/consultas"           element={<ViewDossie />} />
          <Route path="/dossie"              element={<ViewDossie />} />
          <Route path="/config"              element={<ViewSettings />} />
        </Routes>
      </main>
    </div>
  );
}
