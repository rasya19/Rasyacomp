import { supabase } from '../src/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { school_name, admin_email, email, phone, alamat, subdomain } = req.body;

  const { data, error } = await supabase
    .from('schools')
    .insert([
      {
        nama_sekolah: school_name,
        admin_email,
        email,
        phone,
        alamat,
        subdomain,
        status: 'pending'
      }
    ]);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true, data });
}
