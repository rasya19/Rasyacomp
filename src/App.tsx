import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RasyatechLanding from './components/RasyatechLanding';
import MasterAdmin from './components/MasterAdmin/Dashboard';
import TenantDashboard from './components/TenantDashboard';
import AffiliatePortal from './components/AffiliatePortal';
import SchoolLogin from './components/SchoolLogin';
import RegisterSchool from './components/RegisterSchool';

// Mengarahkan ke file baru yang Mas Ismanto buat di folder src/components/
import ProtectedTenant from './components/ProtectedTenant'; 

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

      {/* SUPER ADMIN (Bypass proteksi yang filenya hilang agar Vercel sukses build) */}
      <Route 
        path="/master-admin" 
        element={<MasterAdmin />} 
      />

      {/* TENANT (Menggunakan file ProtectedTenant baru milik Mas Ismanto) */}
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