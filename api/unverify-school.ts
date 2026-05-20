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

  const uid = req.body.uid || req.body.authUserId;
  const registrationId = req.body.registrationId || req.body.schoolId;
  const subdomain = req.body.subdomain;
  
  if (!uid || !registrationId) {
      return res.status(400).json({ 
          error: "User ID and registrationId are required",
          received: { uid, registrationId, body: req.body } 
      });
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
    // 5a. Ambil data pendaftaran dulu untuk mendapatkan subdomain & auth_uid jika diperlukan
    const { data: reg, error: fetchError } = await adminSupabase
      .from('registrations')
      .select('subdomain, auth_uid')
      .eq('id', registrationId)
      .single();

    if (fetchError || !reg) {
        return res.status(404).json({ error: "Registration not found" });
    }

    const finalUid = uid || reg.auth_uid;
    const finalSubdomain = subdomain || reg.subdomain;

    if (!finalUid) {
        return res.status(400).json({ error: "User ID (auth_uid) not found for this registration" });
    }

    // 5b. UPDATE STATUS DI DATABASE (Reset semua data verifikasi)
    const { error: dbError } = await adminSupabase
      .from('registrations')
      .update({ 
        status: 'pending',
        auth_uid: null,
        activated_at: null,
        expired_at: null
      })
      .eq('id', registrationId);

    if (dbError) {
        return res.status(400).json({ error: `Database error: ${dbError.message}` });
    }

    // 5c. HAPUS DATA DI TABEL schools (Multi-tenant)
    if (finalSubdomain && finalSubdomain !== '-') {
      const { error: schoolDeleteError } = await adminSupabase
        .from('schools')
        .delete()
        .eq('id', finalSubdomain);
      
      if (schoolDeleteError) {
        console.warn("Gagal hapus data di tabel schools:", schoolDeleteError.message);
      }
    }

    // 5d. PROSES DELETE USER DI SUPABASE AUTH
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(finalUid);

    if (deleteError) {
        console.error("Auth delete error:", deleteError);
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
