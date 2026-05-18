import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubdomain } from '../lib/SubdomainContext'; // ← Sudah dikoreksi jadi 2 titik
import { useTenantAuth } from '../lib/useTenantAuth';   // ← Sudah dikoreksi jadi 2 titik

interface ProtectedTenantProps {
  children: React.ReactNode;
}

export default function ProtectedTenant({ children }: ProtectedTenantProps) {
  const subdomain = useSubdomain();
  const { user, loading, tenantStatus } = useTenantAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Jika tidak ada subdomain atau user belum login, tendang ke login sekolah
  if (!subdomain || !user) {
    return <Navigate to="/login-sekolah" replace />;
  }

  // Jika akun sekolah belum di-approve oleh Master Admin, batasi aksesnya
  if (tenantStatus !== 'approved') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-md">
          <h2 className="text-xl font-bold text-slate-800">Akses Tertunda</h2>
          <p className="mt-2 text-sm text-slate-600">
            Pendaftaran sekolah Anda sedang ditinjau oleh Super Admin. Silakan hubungi admin via WhatsApp untuk mempercepat verifikasi.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}