import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useSubdomain } from "./SubdomainContext";

export function useTenantAuth() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  const subdomain = useSubdomain();

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser && subdomain) {
        const { data } = await supabase
          .from("schools")
          .select("*")
          .eq("subdomain", subdomain)
          .eq("status", "approved")
          .maybeSingle();

        setSchool(data);
      }

      setLoading(false);
    };

    load();
  }, [subdomain]);

  return { user, school, loading };
}
