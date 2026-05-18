import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. SET HEADERS CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://rasyatech.rsch.my.id');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 2. TANGANI PREFLIGHT
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. BATASI HANYA UNTUK METHOD POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { uid, registrationId } = req.body;
  
  if (!uid || !registrationId) {
      return res.status(400).json({ error: "User ID (uid) and registrationId are required" });
  }

  // 4. VALIDASI KONFIGURASI SERVER (ENV)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const adminSupabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 5a. UPDATE STATUS DI DATABASE
    const { error: dbError } = await adminSupabase
      .from('registrations')
      .update({ status: 'pending' })
      .eq('id', registrationId);

    if (dbError) {
        return res.status(400).json({ error: `Database error: ${dbError.message}` });
    }

    // 5b. PROSES DELETE USER DI SUPABASE AUTH
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(uid);

    if (deleteError) {
        console.error("Auth delete error:", deleteError);
        // Note: DB is updated, user auth not deleted. Might want to roll back DB update here.
        return res.status(400).json({ error: `Auth error: ${deleteError.message}` });
    }

    // 6. RESPON SUKSES
    return res.status(200).json({ 
        success: true, 
        message: "Verifikasi berhasil dibatalkan (Status: pending, User dihapus)"
    });

  } catch (error: any) {
    console.error("Backend Error (Unverify):", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
