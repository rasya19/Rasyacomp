import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PendingSchools() {
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    supabase
      .from('schools')
      .select('*')
      .eq('status', 'pending')
      .then((res) => setSchools(res.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pendaftar Sekolah</h1>
      <ul>
        {schools.map((s) => (
          <li key={s.id}>
            {s.nama_sekolah} — {s.email} — {s.phone}
          </li>
        ))}
      </ul>
    </div>
  );
}
