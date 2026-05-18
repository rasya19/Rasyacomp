import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const allowedOrigins = [
    'https://rasyatech.rsch.my.id',
    'https://rasyatech.rsch.web.id',
    'https://rasyatech-lms-engine.vercel.app'
  ];

  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json());

  // Setup nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // API route for school verification
  app.post("/api/verify-school", async (req, res) => {
    console.log("Received POST to /api/verify-school. Body:", req.body);
    const { email, school_name, subdomain } = req.body;
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_URL) {
      return res.status(500).json({ error: "Server configuration missing" });
    }

    const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Create User
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { school_name, subdomain }
    });

    if (userError) return res.status(400).json({ error: userError.message });

    // 2. Send email
    try {
        console.log(`Attempting to send email to ${email}...`);
        const info = await transporter.sendMail({
            from: '"Rasyacomp Support" <ismanto095@gmail.com>',
            to: email,
            subject: `Selamat! Website Sekolah ${school_name} Telah Aktif`,
            text: `Halo Admin ${school_name},\n\nPendaftaran Anda di Rasyatech telah diverifikasi. Sekarang Anda sudah memiliki website resmi sendiri. Berikut adalah detail akses Anda:\n\nURL Website: https://${subdomain}.rasch.my.id\n\nEmail Login: ${email}\n\nSilakan klik URL di atas untuk mulai mengelola profil sekolah Anda. Terima kasih telah mempercayakan layanan digital Anda kepada Rasyatech.\n\nSalam,\nRasyacomp Support`
        });
        console.log("Email sent successfully:", info.messageId);
    } catch (emailError: any) {
        console.error("Failed to send email. Error details:", {
            message: emailError.message,
            code: emailError.code,
            command: emailError.command,
            response: emailError.response
        });
        // Don't fail the verification if email fails
    }

    res.json({ success: true, user: userData.user });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

export default async (req: any, res: any) => {
    const app = await startServer();
    return app(req, res);
};

if (process.env.NODE_ENV !== 'production') {
    async function listen() {
        const app = await startServer();
        app.listen(3000, "0.0.0.0", () => {
             console.log(`Server running on http://localhost:3000`);
        });
    }
    listen();
}

