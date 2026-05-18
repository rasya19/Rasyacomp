import { Navigate } from "react-router-dom";
import { useTenantAuth } from "../../lib/useTenantAuth";
import { useSubdomain } from "../../lib/SubdomainContext";

export default function ProtectedTenant({ children }) {
  const { user, school, loading } = useTenantAuth();
  const subdomain = useSubdomain();

  if (loading) return <p>Loading...</p>;

  if (!subdomain) return <Navigate to="/" />;
  if (!user) return <Navigate to="/login-sekolah" />;

  if (!school) {
    return <p>Menunggu approval sekolah...</p>;
  }

  return children;
}
