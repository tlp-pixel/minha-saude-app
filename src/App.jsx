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
import ViewSettings from './views/ViewSettings';
import { EXAMS, BIOMARKERS } from './data/biomarkers';

export default function App() {
  return (
    <div className="app">
      <Sidebar
        examCount={EXAMS.length}
        bioCount={BIOMARKERS.length}
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
          <Route path="/dossie"              element={<ViewDossie />} />
          <Route path="/config"              element={<ViewSettings />} />
        </Routes>
      </main>
    </div>
  );
}
