import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. SET HEADERS CORS (Surat Izin Browser)
  res.setHeader('Access-Control-Allow-Origin', 'https://rasyatech.rsch.my.id');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 2. TANGANI PREFLIGHT (Tes Ombak Browser)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. BATASI HANYA UNTUK METHOD POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, school_name, subdomain } = req.body;
  
  // 4. VALIDASI KONFIGURASI SERVER (ENV)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const adminSupabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Generate password
    const generatedPassword = Math.random().toString(36).slice(-8);

    // 5. PROSES CREATE USER DI SUPABASE
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { school_name, subdomain }
    });

    if (userError) {
        return res.status(400).json({ error: userError.message });
    }

    // Update registration with auth_uid
    const { error: dbError } = await adminSupabase
      .from('registrations')
      .update({ auth_uid: userData.user.id, status: 'verified' })
      .eq('admin_email', email);

    if (dbError) {
        console.error("Failed to update registration with auth_uid:", dbError);
        // We might want to delete the user if DB update fails to keep things consistent,
        // but for now, we'll just log it.
    }

    // 6. KONFIGURASI PENGIRIMAN EMAIL (NODEMAILER)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
    
        // 7. KIRIM EMAIL NOTIFIKASI
        await transporter.sendMail({
            from: '"Rasyacomp Support" <ismanto095@gmail.com>',
            to: email,
            subject: `Selamat! Website Sekolah ${school_name} Telah Aktif`,
            text: `Halo Admin ${school_name},\n\nPendaftaran Anda di Rasyatech telah diverifikasi. Sekarang Anda sudah memiliki website resmi sendiri. Berikut adalah detail akses Anda:\n\nURL Website: https://${subdomain}.rsch.my.id\n\nEmail Login: ${email}\nPassword: ${generatedPassword}\n\nSilakan klik URL di atas untuk mulai mengelola profil sekolah Anda. Terima kasih telah mempercayakan layanan digital Anda kepada Rasyatech.\n\nSalam,\nRasyacomp Support`
        });
    } else {
        console.warn("EMAIL_USER or EMAIL_PASS not set, skipping email notification");
    }

    // 8. RESPON SUKSES
    return res.status(200).json({ 
        success: true, 
        message: "Verifikasi berhasil dan email terkirim",
        user: userData.user 
    });

  } catch (error: any) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}