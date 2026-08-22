import { Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import NotFound from './components/NotFound';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import MyPartsPage from './pages/MyPartsPage';
import PartDetailPage from './pages/PartDetailPage';
import BuildsPage from './pages/BuildsPage';
import BuildDetailPage from './pages/BuildDetailPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <div className="min-vh-100 bg-body-tertiary">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/parts/mine" element={<MyPartsPage />} />
        <Route path="/parts/:id" element={<PartDetailPage />} />
        <Route path="/builds" element={<BuildsPage />} />
        <Route path="/builds/:id" element={<BuildDetailPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="bg-dark border-top border-warning border-4 text-center text-light py-4 mt-5">
        <div className="container"><span className="text-warning fw-bold">PC Parts &amp; Builds</span> · Build something bright.</div>
      </footer>
    </div>
  );
}

export default App;
