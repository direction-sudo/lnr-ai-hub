import { Routes, Route } from 'react-router-dom';
import StarNestBackground from '@/components/StarNestBackground';
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <>
      <StarNestBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/*" element={<LandingPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
