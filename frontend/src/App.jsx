import { Routes, Route, } from "react-router-dom";
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import NotFound from './components/NotFound';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/Search" element={<SearchPage />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <hr />
    </>
  );
}

export default App;