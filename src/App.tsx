import { Routes, Route } from 'react-router-dom';
import StarNestBackground from '@/components/StarNestBackground';
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';

function App() {
  return (
    <>
      <StarNestBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/*" element={<LandingPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
