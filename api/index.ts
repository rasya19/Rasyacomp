import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const app = express();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey!);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

// API route for school verification
app.post("/api/verify-school", async (req, res) => {
  const { email, school_name, subdomain, registrationId } = req.body;
  
  try {
    const activationDate = new Date();

    // 1. Create Supabase Auth User
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { school_name, subdomain }
    });

    if (userError && userError.status !== 422) {
      return res.status(400).json({ error: userError.message });
    }

    // 2. Update status di tabel registrations
    const { error: regError } = await supabase
      .from('registrations')
      .update({ 
        status: 'verified',
        subdomain: subdomain,
        activated_at: activationDate.toISOString(),
        expired_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        auth_uid: userData?.user?.id
      })
      .eq('id', registrationId);

    if (regError) throw regError;

    // 3. Insert/Upsert ke tabel schools
    const { error: schoolError } = await supabase
      .from('schools') 
      .upsert([{
        id: subdomain,
        nama_sekolah: school_name || 'Sekolah Baru', 
        registration_id: registrationId,
        created_at: activationDate.toISOString()
      }], { onConflict: 'id' });

    if (schoolError) throw schoolError;

    // 4. Send welcome email
    try {
      const domainUtama = "rsch.my.id";
      const urlSekolah = `https://${subdomain}.${domainUtama}`;
      
      await transporter.sendMail({
        from: '"Rasyacomp Support" <ismanto095@gmail.com>',
        to: email,
        subject: `Selamat! Website Sekolah ${school_name} Telah Aktif`,
        text: `Halo Admin ${school_name},\n\nPendaftaran Anda di Rasyatech telah diverifikasi. Sekarang Anda sudah memiliki website resmi sendiri. Berikut adalah detail akses Anda:\n\nURL Website: ${urlSekolah}\n\nEmail Login: ${email}\n\nSilakan klik URL di atas untuk mulai mengelola profil sekolah Anda. Terima kasih telah mempercayakan layanan digital Anda kepada Rasyatech.\n\nSalam,\nRasyacomp Support`
      });
    } catch (emailError: any) {
      console.warn("Failed to send email:", emailError.message);
    }

    res.json({ success: true, message: "Verifikasi berhasil & Email terkirim!" });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API route for unverify school
app.post("/api/unverify-school", async (req, res) => {
  const { registrationId, subdomain } = req.body;
  
  try {
    const { data: reg, error: fetchError } = await supabase
      .from('registrations')
      .select('subdomain, auth_uid')
      .eq('id', registrationId)
      .single();

    if (fetchError || !reg) {
      return res.status(404).json({ error: "Registration not found" });
    }

    const { error: dbError } = await supabase
      .from('registrations')
      .update({ 
        status: 'pending',
        subdomain: '-',
        activated_at: null,
        expired_at: null,
        auth_uid: null
      })
      .eq('id', registrationId);

    if (dbError) throw dbError;

    const finalSubdomain = subdomain || reg.subdomain;
    if (finalSubdomain && finalSubdomain !== '-') {
      await supabase.from('schools').delete().eq('id', finalSubdomain);
    }

    if (reg.auth_uid) {
      await supabase.auth.admin.deleteUser(reg.auth_uid);
    }

    res.json({ success: true, message: "Verifikasi berhasil dibatalkan!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API route for deleting registration
app.delete("/api/delete-registration/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Ambil data pendaftaran untuk pembersihan
    const { data: reg } = await supabase
      .from('registrations')
      .select('id, subdomain, auth_uid')
      .eq('id', id)
      .single();

    // 2. Hapus data di tabel schools
    if (reg?.subdomain && reg.subdomain !== '-') {
      await supabase.from('schools').delete().eq('id', reg.subdomain);
    }
    await supabase.from('schools').delete().eq('registration_id', id);

    // 3. Hapus User Auth jika ada
    if (reg?.auth_uid) {
      await supabase.auth.admin.deleteUser(reg.auth_uid);
    }

    // 4. Hapus pendaftaran utama
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: "Pendaftar berhasil dihapus permanen!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
