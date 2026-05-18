import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RasyatechLanding from './components/RasyatechLanding';
import MasterAdmin from './components/MasterAdmin/Dashboard';
import TenantDashboard from './components/TenantDashboard';
import AffiliatePortal from './components/AffiliatePortal';
import SchoolLogin from './components/SchoolLogin';
import RegisterSchool from './components/RegisterSchool';
import ProtectedAdmin from './components/MasterAdmin/ProtectedAdmin';      // ← TAMBAHAN 1
import ProtectedTenant from './components/TenantDashboard/ProtectedTenant'; // ← TAMBAHAN 2

import { SubdomainProvider, useSubdomain } from './lib/SubdomainContext';

function AppRoutes() {
  const subdomain = useSubdomain();

  return (
    <Routes>

      {/* Landing Page */}
      <Route 
        path="/" 
        element={!subdomain ? <RasyatechLanding /> : <Navigate to="/admin" />} 
      />

      {/* SUPER ADMIN (proteksi baru dipasang di sini) */}
      <Route 
        path="/master-admin" 
        element={
          <ProtectedAdmin>
            <MasterAdmin />
          </ProtectedAdmin>
        }
      />

      {/* TENANT (diakses hanya dari subdomain + approved) */}
      <Route 
        path="/admin" 
        element={
          <ProtectedTenant>
            <TenantDashboard />
          </ProtectedTenant>
        }
      />

      {/* Affiliate */}
      <Route 
        path="/affiliate/portal" 
        element={!subdomain ? <AffiliatePortal /> : <Navigate to="/admin" />} 
      />

      {/* Login Sekolah */}
      <Route 
        path="/login-sekolah" 
        element={subdomain ? <SchoolLogin /> : <Navigate to="/" />} 
      />

      {/* Form Pendaftaran Sekolah */}
      <Route 
        path="/daftar-sekolah" 
        element={<RegisterSchool />} 
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}

export default function App() {
  return (
    <SubdomainProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SubdomainProvider>
  );
}
